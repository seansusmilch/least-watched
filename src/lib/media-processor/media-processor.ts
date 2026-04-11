import { prisma, sonarrSettingsService, radarrSettingsService } from '@/lib/database';
import { type DeletionScoreSettings } from '@/lib/types/settings';
import { folderSpaceService } from '@/lib/services/folder-space-service';
import { eventsService } from '@/lib/services/events-service';
import { ProgressStore } from './progress-store';
import { MEDIA_PROCESSOR_ITEM_LIMIT } from './constants';
import { MediaStorage } from './storage';
import {
  type MediaProcessingProgress,
  type ProcessingRunStats,
} from '@/lib/types/media-processing';
import { type ProcessedMediaItem } from '@/lib/types/media';
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import { getDatePreference } from '@/lib/actions/settings/app-settings';
import { sonarrApiClient } from '@/lib/services/sonarr-service';
import { radarrApiClient } from '@/lib/services/radarr-service';
import { EmbyService } from '@/lib/services/emby-service';
import { singleEmbySettingsService } from '@/lib/utils/single-emby-settings';
import { createBaseProcessedItem } from './emby-item-processor';
import { findRadarrMatch, findSonarrMatch } from './arr-matching';
import { enrichFromRadarr, enrichFromSonarr } from './arr-enrichment';
import { buildArrMaps } from './arr-maps';
import type Emby from 'emby-sdk-stainless';

type StoredMediaItem = Awaited<
  ReturnType<typeof prisma.mediaItem.findMany>
>[number];

export class MediaProcessor {
  private onProgress?: (progress: MediaProcessingProgress) => void;

  constructor(onProgress?: (progress: MediaProcessingProgress) => void) {
    this.onProgress = onProgress;
  }

  private async updateProgress(
    phase: string,
    current: number,
    total: number,
    currentItem: string = ''
  ) {
    const progress: MediaProcessingProgress = {
      phase,
      current,
      total,
      currentItem,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };

    // Store progress globally
    await ProgressStore.setProgress(progress);

    // Call callback if provided
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  async processAllMedia(): Promise<ProcessedMediaItem[]> {
    const allProcessedItems: ProcessedMediaItem[] = [];
    const runStartTime = performance.now();

    const runStats: ProcessingRunStats = {
      totalTimeMs: 0,
      itemsProcessed: 0,
      itemsWithArrMatch: 0,
      itemsWithPlayback: 0,
      avgTimePerItemMs: 0,
      embyItemsFetched: 0,
      sonarrSeriesFetched: 0,
      radarrMoviesFetched: 0,
    };

    await this.updateProgress(
      'Initializing',
      0,
      100,
      'Starting media processing...'
    );

    const [sonarrInstances, radarrInstances, datePreference, embyInstance] =
      await Promise.all([
        sonarrSettingsService.getEnabled(),
        radarrSettingsService.getEnabled(),
        getDatePreference(),
        singleEmbySettingsService.getEnabled(),
      ]);

    if (!embyInstance) {
      await eventsService.logWarning(
        'media-processor',
        'No enabled Emby instance found. Skipping processing.'
      );
      await ProgressStore.setProgress({
        phase: 'Complete',
        current: 0,
        total: 0,
        currentItem: 'No Emby instance configured',
        percentage: 100,
        isComplete: true,
      });
      return [];
    }

    const selectedLibraryIds = embyInstance.selectedLibraries || [];
    const libraryInfo =
      selectedLibraryIds.length > 0
        ? `${selectedLibraryIds.length} selected library${
            selectedLibraryIds.length > 1 ? 'ies' : 'y'
          }`
        : 'all libraries';
    const itemLimitInfo = MEDIA_PROCESSOR_ITEM_LIMIT
      ? `item limit: ${MEDIA_PROCESSOR_ITEM_LIMIT} per type`
      : 'no item limit';
    const configMessage = `Media processing started (date preference: ${datePreference}, ${libraryInfo}, ${itemLimitInfo}, ${
      sonarrInstances.length
    } Sonarr instance${sonarrInstances.length !== 1 ? 's' : ''}, ${
      radarrInstances.length
    } Radarr instance${radarrInstances.length !== 1 ? 's' : ''})`;
    await eventsService.logInfo('media-processor', configMessage);

    // Build Arr enrichment maps
    const [allSeries, allMovies] = await Promise.all([
      Promise.all(
        sonarrInstances.map((i) => sonarrApiClient.getSeries(i))
      ).then((list) => list.flat()),
      Promise.all(
        radarrInstances.map((i) => radarrApiClient.getMovies(i))
      ).then((list) => list.flat()),
    ]);

    runStats.sonarrSeriesFetched = allSeries.length;
    runStats.radarrMoviesFetched = allMovies.length;

    const arrMaps = buildArrMaps(allSeries, allMovies);

    const embyItems = await EmbyService.listLibraryItems({
      embyInstance,
      libraryIds: selectedLibraryIds,
      types: ['Movie', 'Series'],
      pageSize: 500,
    });

    const seriesItems = embyItems.filter((item) => item.Type === 'Series');
    const movieItems = embyItems.filter((item) => item.Type === 'Movie');

    const limitedSeries = MEDIA_PROCESSOR_ITEM_LIMIT
      ? seriesItems.slice(0, MEDIA_PROCESSOR_ITEM_LIMIT)
      : seriesItems;
    const limitedMovies = MEDIA_PROCESSOR_ITEM_LIMIT
      ? movieItems.slice(0, MEDIA_PROCESSOR_ITEM_LIMIT)
      : movieItems;

    const limited = [...limitedSeries, ...limitedMovies];
    const totalItems = limited.length;

    await this.updateProgress(
      'Enumerating Emby',
      0,
      totalItems,
      `Found ${limitedSeries.length} series and ${limitedMovies.length} movies`
    );

    const deletionScoreSettings: DeletionScoreSettings =
      await getDeletionScoreSettings();
    const folderSpaceData = await folderSpaceService.getFolderSpaceData();

    runStats.embyItemsFetched = totalItems;

    for (let i = 0; i < limited.length; i++) {
      const item = limited[i] as Emby.BaseItem;
      const name: string = item.Name || item.OriginalTitle || 'Unknown';
      const itemStartTime = performance.now();

      await eventsService.logInfo(
        'media-processor',
        `Started processing ${name}`
      );

      await this.updateProgress(
        'Processing Emby Items',
        i + 1,
        totalItems,
        name
      );

      let arrMatch: 'sonarr' | 'radarr' | 'none' = 'none';
      let playbackFound = false;
      let deletionScore = -1;

      try {
        if (!item?.Id) {
          await eventsService.logWarning(
            'media-processor',
            `Skipping Emby item without Id: ${name}`
          );
          continue;
        }

        const type = item.Type === 'Series' ? 'tv' : 'movie';
        const processed = createBaseProcessedItem(item);

        if (type === 'movie') {
          const match = findRadarrMatch(
            processed.tmdbId ?? undefined,
            processed.imdbId ?? undefined,
            arrMaps.movieMapByTmdb,
            arrMaps.movieMapByImdb
          );
          if (match) {
            arrMatch = 'radarr';
            enrichFromRadarr(processed, match);
          }
        } else {
          const match = findSonarrMatch(
            processed.tvdbId ?? undefined,
            processed.tmdbId ?? undefined,
            processed.imdbId ?? undefined,
            arrMaps.tvMapByTvdb,
            arrMaps.tvMapByTmdb,
            arrMaps.tvMapByImdb
          );
          if (match) {
            arrMatch = 'sonarr';
            enrichFromSonarr(processed, match);
          }
        }

        // Playback enrichment via EmbyService abstraction
        const playback = await EmbyService.getAggregatedPlaybackInfo(
          {
            title: name,
            type,
            embyId: String(item.Id),
          },
          embyInstance
        );
        if (playback) {
          playbackFound = true;
          processed.lastWatched = playback.lastWatched;
          processed.watchCount = playback.watchCount || 0;
        }

        deletionScore = await MediaStorage.storeProcessedItem(
          processed,
          deletionScoreSettings,
          folderSpaceData,
          datePreference
        );
        allProcessedItems.push(processed);

        if (arrMatch !== 'none') {
          runStats.itemsWithArrMatch++;
        }
        if (playbackFound) {
          runStats.itemsWithPlayback++;
        }
        runStats.itemsProcessed++;

        const itemTimeMs = Math.round(performance.now() - itemStartTime);
        await eventsService.logInfo(
          'media-processor',
          `Finished processing ${name} in ${itemTimeMs}ms | arr: ${arrMatch} | playback: ${
            playbackFound ? 'found' : 'none'
          } | score: ${deletionScore}`
        );
      } catch (err) {
        const itemTimeMs = Math.round(performance.now() - itemStartTime);
        await eventsService.logError(
          'media-processor',
          `Error processing "${name}" after ${itemTimeMs}ms: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    await ProgressStore.setProgress({
      phase: 'Complete',
      current: totalItems,
      total: totalItems,
      currentItem: `Processed ${allProcessedItems.length} items`,
      percentage: 100,
      isComplete: true,
    });

    runStats.totalTimeMs = Math.round(performance.now() - runStartTime);
    runStats.avgTimePerItemMs =
      runStats.itemsProcessed > 0
        ? Math.round(runStats.totalTimeMs / runStats.itemsProcessed)
        : 0;

    const totalTimeSec = (runStats.totalTimeMs / 1000).toFixed(1);
    await eventsService.logInfo(
      'media-processor',
      `Processing complete: ${runStats.itemsProcessed} items in ${totalTimeSec}s (${runStats.itemsWithArrMatch} arr matches, ${runStats.itemsWithPlayback} with playback) | Avg: ${runStats.avgTimePerItemMs}ms/item | Pre-fetch: ${runStats.sonarrSeriesFetched} Sonarr series, ${runStats.radarrMoviesFetched} Radarr movies | Emby items: ${limitedSeries.length} series, ${limitedMovies.length} movies (${runStats.embyItemsFetched} total)`
    );

    return allProcessedItems;
  }

  async processByDatabaseIds(ids: string[]): Promise<ProcessedMediaItem[]> {
    const allProcessedItems: ProcessedMediaItem[] = [];
    const runStartTime = performance.now();

    const runStats: ProcessingRunStats = {
      totalTimeMs: 0,
      itemsProcessed: 0,
      itemsWithArrMatch: 0,
      itemsWithPlayback: 0,
      avgTimePerItemMs: 0,
      embyItemsFetched: 0,
      sonarrSeriesFetched: 0,
      radarrMoviesFetched: 0,
    };

    await this.updateProgress('Initializing', 0, 100, 'Starting selected media rescan...');

    const [sonarrInstances, radarrInstances, datePreference, embyInstance] =
      await Promise.all([
        sonarrSettingsService.getEnabled(),
        radarrSettingsService.getEnabled(),
        getDatePreference(),
        singleEmbySettingsService.getEnabled(),
      ]);

    if (!embyInstance) {
      await eventsService.logWarning(
        'media-processor',
        'No enabled Emby instance found. Skipping selected media rescan.'
      );
      await ProgressStore.setProgress({
        phase: 'Complete',
        current: 0,
        total: 0,
        currentItem: 'No Emby instance configured',
        percentage: 100,
        isComplete: true,
      });
      return [];
    }

    const deletionScoreSettings = await getDeletionScoreSettings();
    const folderSpaceData = await folderSpaceService.getFolderSpaceData();

    const mediaItems = await prisma.mediaItem.findMany({
      where: { id: { in: ids } },
      orderBy: { updatedAt: 'desc' },
    });

    if (mediaItems.length === 0) {
      await eventsService.logWarning(
        'media-processor',
        `No media items found for selected rescan (${ids.length} requested)`
      );
      await ProgressStore.setProgress({
        phase: 'Complete',
        current: 0,
        total: 0,
        currentItem: 'No matching media items found',
        percentage: 100,
        isComplete: true,
      });
      return [];
    }

    const selectedCount = mediaItems.length;
    const itemLimitInfo = `${selectedCount} selected item${selectedCount === 1 ? '' : 's'}`;
    const configMessage = `Selected media rescan started (date preference: ${datePreference}, ${itemLimitInfo}, ${sonarrInstances.length} Sonarr instance${sonarrInstances.length !== 1 ? 's' : ''}, ${radarrInstances.length} Radarr instance${radarrInstances.length !== 1 ? 's' : ''})`;
    await eventsService.logInfo('media-processor', configMessage);

    const [allSeries, allMovies] = await Promise.all([
      Promise.all(
        sonarrInstances.map((instance) => sonarrApiClient.getSeries(instance))
      ).then((list) => list.flat()),
      Promise.all(
        radarrInstances.map((instance) => radarrApiClient.getMovies(instance))
      ).then((list) => list.flat()),
    ]);

    runStats.sonarrSeriesFetched = allSeries.length;
    runStats.radarrMoviesFetched = allMovies.length;

    const arrMaps = buildArrMaps(allSeries, allMovies);

    runStats.embyItemsFetched = selectedCount;

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i] as StoredMediaItem;
      const itemStartTime = performance.now();
      const name = item.title || 'Unknown';

      await eventsService.logInfo(
        'media-processor',
        `Started selected rescan for ${name}`
      );

      await this.updateProgress('Processing Selected Items', i + 1, selectedCount, name);

      let arrMatch: 'sonarr' | 'radarr' | 'none' = 'none';
      let playbackFound = false;
      let deletionScore = -1;

      try {
        const freshEmbyItem = await EmbyService.findItemByProviderIds(
          {
            tmdbId: item.tmdbId,
            imdbId: item.imdbId,
            tvdbId: item.tvdbId,
            type: item.type as 'movie' | 'tv',
          },
          embyInstance
        );

        if (!freshEmbyItem?.Id) {
          await eventsService.logWarning(
            'media-processor',
            `Skipping selected rescan for ${name}: no current Emby item found`
          );
          continue;
        }

        const freshEmbyId = String(freshEmbyItem.Id);
        if (freshEmbyId !== item.embyId) {
          await prisma.mediaItem.update({
            where: { id: item.id },
            data: { embyId: freshEmbyId },
          });
        }

        const processed = createBaseProcessedItem(freshEmbyItem);

        if (processed.type === 'movie') {
          const match = findRadarrMatch(
            processed.tmdbId ?? undefined,
            processed.imdbId ?? undefined,
            arrMaps.movieMapByTmdb,
            arrMaps.movieMapByImdb
          );
          if (match) {
            arrMatch = 'radarr';
            enrichFromRadarr(processed, match);
          }
        } else {
          const match = findSonarrMatch(
            processed.tvdbId ?? undefined,
            processed.tmdbId ?? undefined,
            processed.imdbId ?? undefined,
            arrMaps.tvMapByTvdb,
            arrMaps.tvMapByTmdb,
            arrMaps.tvMapByImdb
          );
          if (match) {
            arrMatch = 'sonarr';
            enrichFromSonarr(processed, match);
          }
        }

        const playback = await EmbyService.getAggregatedPlaybackInfo(
          {
            title: name,
            type: processed.type,
            embyId: freshEmbyId,
          },
          embyInstance
        );

        if (playback) {
          playbackFound = true;
          processed.lastWatched = playback.lastWatched;
          processed.watchCount = playback.watchCount || 0;
        }

        deletionScore = await MediaStorage.storeProcessedItem(
          processed,
          deletionScoreSettings,
          folderSpaceData,
          datePreference
        );
        allProcessedItems.push(processed);

        if (arrMatch !== 'none') {
          runStats.itemsWithArrMatch++;
        }
        if (playbackFound) {
          runStats.itemsWithPlayback++;
        }
        runStats.itemsProcessed++;

        const itemTimeMs = Math.round(performance.now() - itemStartTime);
        await eventsService.logInfo(
          'media-processor',
          `Finished selected rescan for ${name} in ${itemTimeMs}ms | arr: ${arrMatch} | playback: ${
            playbackFound ? 'found' : 'none'
          } | score: ${deletionScore}`
        );
      } catch (error) {
        const itemTimeMs = Math.round(performance.now() - itemStartTime);
        await eventsService.logError(
          'media-processor',
          `Error rescanning "${name}" after ${itemTimeMs}ms: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    await ProgressStore.setProgress({
      phase: 'Complete',
      current: selectedCount,
      total: selectedCount,
      currentItem: `Processed ${allProcessedItems.length} items`,
      percentage: 100,
      isComplete: true,
    });

    runStats.totalTimeMs = Math.round(performance.now() - runStartTime);
    runStats.avgTimePerItemMs =
      runStats.itemsProcessed > 0
        ? Math.round(runStats.totalTimeMs / runStats.itemsProcessed)
        : 0;

    const totalTimeSec = (runStats.totalTimeMs / 1000).toFixed(1);
    await eventsService.logInfo(
      'media-processor',
      `Selected media rescan complete: ${runStats.itemsProcessed} items in ${totalTimeSec}s (${runStats.itemsWithArrMatch} arr matches, ${runStats.itemsWithPlayback} with playback) | Avg: ${runStats.avgTimePerItemMs}ms/item | Pre-fetch: ${runStats.sonarrSeriesFetched} Sonarr series, ${runStats.radarrMoviesFetched} Radarr movies | Selected items: ${selectedCount}`
    );

    return allProcessedItems;
  }
}
