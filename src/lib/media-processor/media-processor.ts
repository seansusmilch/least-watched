import { sonarrSettingsService, radarrSettingsService } from '@/lib/database';
import { type DeletionScoreSettings } from '@/lib/actions/settings/types';
import { folderSpaceService } from '@/lib/services/folder-space-service';
import { ProgressStore } from './progress-store';
import { MEDIA_PROCESSOR_ITEM_LIMIT } from './constants';
import { MediaStorage } from './storage';
import {
  type MediaProcessingProgress,
  type ProcessedMediaItem,
  type ProcessingRunStats,
} from './types';
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
      console.log('ℹ️ No enabled Emby instance. Skipping processing.');
      return [];
    }

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

    // Get selected libraries (fallback to all)
    const selectedLibraryIds = embyInstance.selectedLibraries || [];
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

      console.log(`⏱️ Started processing ${name}`);

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
          console.log(`⚠️ Skipping Emby item without Id: ${name}`);
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
        console.log(
          `✅ Finished processing ${name} in ${itemTimeMs}ms | arr: ${arrMatch} | playback: ${
            playbackFound ? 'found' : 'none'
          } | score: ${deletionScore}`
        );
      } catch (err) {
        const itemTimeMs = Math.round(performance.now() - itemStartTime);
        console.error(
          `Error processing ${name} in ${itemTimeMs}ms | arr: ${arrMatch} | playback: ${
            playbackFound ? 'found' : 'none'
          }:`,
          err
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
    console.log('\n--- Processing Complete ---');
    console.log(
      `Total time: ${totalTimeSec}s | Items: ${runStats.itemsProcessed} | Avg: ${runStats.avgTimePerItemMs}ms/item`
    );
    console.log(
      `Arr matches: ${runStats.itemsWithArrMatch}/${runStats.itemsProcessed} | Playback data: ${runStats.itemsWithPlayback}/${runStats.itemsProcessed}`
    );
    console.log(
      `Pre-fetch: ${runStats.sonarrSeriesFetched} Sonarr series, ${runStats.radarrMoviesFetched} Radarr movies`
    );
    console.log(
      `Emby items: ${limitedSeries.length} series, ${limitedMovies.length} movies (${runStats.embyItemsFetched} total)`
    );

    return allProcessedItems;
  }
}
