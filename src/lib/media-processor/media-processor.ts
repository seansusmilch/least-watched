import { sonarrSettingsService, radarrSettingsService } from '@/lib/database';
import { type DatePreference } from '@/lib/types/media';
import { type DeletionScoreSettings } from '@/lib/actions/settings/types';
import { folderSpaceService } from '@/lib/services/folder-space-service';
import { ProgressStore } from './progress-store';
import { TESTING_LIMIT } from './constants';
import { SonarrProcessor } from './sonarr-processor';
import { RadarrProcessor } from './radarr-processor';
import { MediaStorage } from './storage';
import {
  type MediaProcessingProgress,
  type ProcessedMediaItem,
  type SonarrInstance,
  type RadarrInstance,
} from './types';
import { type FolderSpaceData } from '@/lib/types/media-processing';
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import { getDatePreference } from '@/lib/actions/settings/app-settings';
import { sonarrApiClient } from '@/lib/services/sonarr-service';
import { radarrApiClient } from '@/lib/services/radarr-service';
import { EmbyService } from '@/lib/services/emby-service';
import { singleEmbySettingsService } from '@/lib/utils/single-emby-settings';
import type Emby from 'emby-sdk-stainless';
import path from 'path';

export class MediaProcessor {
  private onProgress?: (progress: MediaProcessingProgress) => void;
  private progressId: string;

  constructor(
    onProgress?: (progress: MediaProcessingProgress) => void,
    progressId?: string
  ) {
    this.onProgress = onProgress;
    this.progressId = progressId || 'default';
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

    const tvMapByTvdb = new Map<number, import('./types').SonarrSeries>();
    const tvMapByTmdb = new Map<number, import('./types').SonarrSeries>();
    const tvMapByImdb = new Map<string, import('./types').SonarrSeries>();
    for (const s of allSeries) {
      if (s.tvdbId) tvMapByTvdb.set(s.tvdbId, s);
      if (s.tmdbId) tvMapByTmdb.set(s.tmdbId, s);
      if (s.imdbId) tvMapByImdb.set(String(s.imdbId).toLowerCase(), s);
    }

    const movieMapByTmdb = new Map<number, import('./types').RadarrMovie>();
    const movieMapByImdb = new Map<string, import('./types').RadarrMovie>();
    for (const m of allMovies) {
      if (m.tmdbId) movieMapByTmdb.set(m.tmdbId, m);
      if (m.imdbId) movieMapByImdb.set(String(m.imdbId).toLowerCase(), m);
    }

    // Get selected libraries (fallback to all)
    const selectedLibraryIds = embyInstance.selectedLibraries || [];
    const embyItems = await EmbyService.listLibraryItems({
      embyInstance,
      libraryIds: selectedLibraryIds,
      types: ['Movie', 'Series'],
      pageSize: 500,
    });

    const totalItems = Math.min(
      embyItems.length,
      TESTING_LIMIT || embyItems.length
    );
    await this.updateProgress(
      'Enumerating Emby',
      0,
      totalItems,
      `Found ${totalItems} items`
    );

    const deletionScoreSettings: DeletionScoreSettings =
      await getDeletionScoreSettings();
    const folderSpaceData = await folderSpaceService.getFolderSpaceData();

    const limited = embyItems.slice(0, totalItems);
    console.log(
      `     🔎 Emby listLibraryItems returned ${limited.length} items`
    );
    // For each item, fetch and log its title
    for (const item of limited) {
      if (item && item.Name) {
        console.log(`     📄 Emby item title: ${item.Id} ${item.Name}`);
      }
    }

    for (let i = 0; i < limited.length; i++) {
      const item = limited[i] as Emby.BaseItem;
      const name: string = item.Name || item.OriginalTitle || 'Unknown';
      await this.updateProgress(
        'Processing Emby Items',
        i + 1,
        totalItems,
        name
      );

      try {
        if (!item?.Id) {
          console.log(`     ⚠️ Skipping Emby item without Id: ${name}`);
          continue;
        }
        const providerIds: Record<string, string> = Object.fromEntries(
          Object.entries(
            ((item as unknown as { ProviderIds?: Record<string, string> })
              .ProviderIds || {}) as Record<string, string>
          ).map(([k, v]) => [k.toLowerCase(), String(v)])
        );

        const type = item.Type === 'Series' ? 'tv' : 'movie';

        // Base processed item from Emby
        const processed: ProcessedMediaItem = {
          title: name,
          type,
          tmdbId: providerIds['tmdb'] ? Number(providerIds['tmdb']) : undefined,
          imdbId: providerIds['imdb'] || providerIds['imdbid'],
          tvdbId: providerIds['tvdb'] ? Number(providerIds['tvdb']) : undefined,
          year: item.ProductionYear ?? undefined,
          mediaPath: item.Path || '',
          parentFolder: item.Path ? path.dirname(item.Path) : '',
          sizeOnDisk: 0,
          dateAddedEmby: item.DateCreated
            ? new Date(item.DateCreated)
            : undefined,
          source: 'Emby',
          embyId: String(item.Id),
        };

        // Enrich from Arr maps
        if (type === 'movie') {
          let match: import('./types').RadarrMovie | undefined = undefined;
          if (processed.tmdbId && movieMapByTmdb.has(processed.tmdbId)) {
            match = movieMapByTmdb.get(processed.tmdbId);
          } else if (
            processed.imdbId &&
            movieMapByImdb.has(processed.imdbId.toLowerCase())
          ) {
            match = movieMapByImdb.get(processed.imdbId.toLowerCase());
          }
          if (match) {
            processed.mediaPath = match.path || processed.mediaPath;
            processed.parentFolder = match.path
              ? path.dirname(match.path)
              : processed.parentFolder;
            processed.sizeOnDisk = match.sizeOnDisk || processed.sizeOnDisk;
            processed.quality =
              match.movieFile?.quality?.quality?.name ?? undefined;
            processed.monitored = match.monitored;
            processed.dateAddedArr = match.added
              ? new Date(match.added)
              : undefined;
            processed.radarrId = match.id;
          }
        } else {
          let match: import('./types').SonarrSeries | undefined = undefined;
          if (processed.tvdbId && tvMapByTvdb.has(processed.tvdbId)) {
            match = tvMapByTvdb.get(processed.tvdbId);
          } else if (processed.tmdbId && tvMapByTmdb.has(processed.tmdbId)) {
            match = tvMapByTmdb.get(processed.tmdbId);
          } else if (
            processed.imdbId &&
            tvMapByImdb.has(processed.imdbId.toLowerCase())
          ) {
            match = tvMapByImdb.get(processed.imdbId.toLowerCase());
          }
          if (match) {
            processed.mediaPath = match.path || processed.mediaPath;
            processed.parentFolder = match.path
              ? path.dirname(match.path)
              : processed.parentFolder;
            processed.sizeOnDisk =
              match.statistics?.sizeOnDisk || processed.sizeOnDisk;
            processed.episodesOnDisk =
              match.statistics?.episodeFileCount || undefined;
            processed.totalEpisodes =
              match.statistics?.totalEpisodeCount || undefined;
            processed.seasonCount = match.statistics?.seasonCount || undefined;
            processed.completionPercentage = match.statistics?.totalEpisodeCount
              ? Math.round(
                  ((match.statistics?.episodeFileCount || 0) /
                    match.statistics?.totalEpisodeCount) *
                    100
                )
              : undefined;
            processed.monitored = match.monitored;
            processed.dateAddedArr = match.added
              ? new Date(match.added)
              : undefined;
            processed.sonarrId = match.id;
          }
        }

        // Optional: playback enrichment using ItemId-based queries (no title prefix)
        {
          if (item.Type === 'Series') {
            const episodeIds = await EmbyService.listEpisodeIdsForSeries(
              String(item.Id),
              embyInstance
            );
            const aggregate = await EmbyService.getPlaybackInfoByItemIds(
              episodeIds,
              embyInstance
            );
            processed.lastWatched = aggregate.lastWatched;
            processed.watchCount = aggregate.watchCount || 0;
          } else if (item.Id) {
            const aggregate = await EmbyService.getPlaybackInfoByItemIds(
              [String(item.Id)],
              embyInstance
            );
            processed.lastWatched = aggregate.lastWatched;
            processed.watchCount = aggregate.watchCount || 0;
          }
        }

        await MediaStorage.storeProcessedItem(
          processed,
          deletionScoreSettings,
          folderSpaceData,
          datePreference
        );
        allProcessedItems.push(processed);
      } catch (err) {
        console.error(`Error processing Emby item ${name}:`, err);
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

    return allProcessedItems;
  }

  private async processSonarrInstance(
    sonarrInstance: SonarrInstance,
    datePreference: DatePreference,
    processedItemCount: number,
    totalItems: number,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[]
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];
    const embyInstance = await singleEmbySettingsService.getEnabled();

    // Get raw series data from Sonarr
    const series = await sonarrApiClient.getSeries(sonarrInstance);
    const limitedSeries = series.slice(0, TESTING_LIMIT);

    // Process each series individually
    for (let i = 0; i < limitedSeries.length; i++) {
      const seriesData = limitedSeries[i];
      const currentItemIndex = processedItemCount + i + 1;

      await this.updateProgress(
        'Processing TV Shows',
        currentItemIndex,
        totalItems,
        `Processing: ${seriesData.title}`
      );

      try {
        // Process single series item
        const processedItem = await SonarrProcessor.processSingleItem(
          seriesData,
          sonarrInstance,
          embyInstance
        );

        // Store the item immediately
        await MediaStorage.storeProcessedItem(
          processedItem,
          deletionScoreSettings,
          folderSpaceData,
          datePreference
        );

        processedItems.push(processedItem);
      } catch (error) {
        console.error(`Error processing series ${seriesData.title}:`, error);
      }
    }

    return processedItems;
  }

  private async processRadarrInstance(
    radarrInstance: RadarrInstance,
    datePreference: DatePreference,
    processedItemCount: number,
    totalItems: number,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[]
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];
    const embyInstance = await singleEmbySettingsService.getEnabled();

    // Get raw movie data from Radarr
    const movies = await radarrApiClient.getMovies(radarrInstance);
    const limitedMovies = movies.slice(0, TESTING_LIMIT);

    // Process each movie individually
    for (let i = 0; i < limitedMovies.length; i++) {
      const movieData = limitedMovies[i];
      const currentItemIndex = processedItemCount + i + 1;

      await this.updateProgress(
        'Processing Movies',
        currentItemIndex,
        totalItems,
        `Processing: ${movieData.title}`
      );

      try {
        // Process single movie item
        const processedItem = await RadarrProcessor.processSingleItem(
          movieData,
          radarrInstance,
          embyInstance
        );

        // Store the item immediately
        await MediaStorage.storeProcessedItem(
          processedItem,
          deletionScoreSettings,
          folderSpaceData,
          datePreference
        );

        processedItems.push(processedItem);
      } catch (error) {
        console.error(`Error processing movie ${movieData.title}:`, error);
      }
    }

    return processedItems;
  }
}
