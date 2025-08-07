import {
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
} from '@/lib/database';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';
import { type EnhancedProcessingSettings } from '@/lib/actions/settings';
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
import {
  getDeletionScoreSettings,
  getEnhancedProcessingSettings,
} from '@/lib/actions/settings';
import { sonarrApiClient } from '@/lib/services/sonarr-service';
import { radarrApiClient } from '@/lib/services/radarr-service';

export class MediaProcessor {
  private onProgress?: (progress: MediaProcessingProgress) => void;
  private enhancedSettings: EnhancedProcessingSettings | null = null;
  private progressId: string;

  constructor(
    onProgress?: (progress: MediaProcessingProgress) => void,
    progressId?: string
  ) {
    this.onProgress = onProgress;
    this.progressId = progressId || 'default';
  }

  private async ensureEnhancedSettings(): Promise<void> {
    if (!this.enhancedSettings) {
      this.enhancedSettings = await getEnhancedProcessingSettings();
    }
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

    // Ensure settings are loaded
    await this.ensureEnhancedSettings();

    // Get all enabled instances
    const [sonarrInstances, radarrInstances, embyInstance] = await Promise.all([
      sonarrSettingsService.getEnabled(),
      radarrSettingsService.getEnabled(),
      embySettingsService.getEnabled(),
    ]);

    // Calculate total items across all instances
    await this.updateProgress(
      'Calculating total items',
      0,
      100,
      'Counting media items...'
    );

    let totalItems = 0;

    // Count Sonarr items
    for (const sonarrInstance of sonarrInstances) {
      try {
        const series = await sonarrApiClient.getSeries(sonarrInstance);
        totalItems += Math.min(series.length, TESTING_LIMIT);
      } catch (error) {
        console.error(
          `Error counting Sonarr items for ${sonarrInstance.name}:`,
          error
        );
      }
    }

    // Count Radarr items
    for (const radarrInstance of radarrInstances) {
      try {
        const movies = await radarrApiClient.getMovies(radarrInstance);
        totalItems += Math.min(movies.length, TESTING_LIMIT);
      } catch (error) {
        console.error(
          `Error counting Radarr items for ${radarrInstance.name}:`,
          error
        );
      }
    }

    let processedItemCount = 0;

    // Get deletion score settings and folder space data for scoring (load once)
    const deletionScoreSettings: DeletionScoreSettings =
      await getDeletionScoreSettings();
    const folderSpaceData = await folderSpaceService.getFolderSpaceData();

    // Process Sonarr instances
    for (const sonarrInstance of sonarrInstances) {
      try {
        const sonarrItems = await this.processSonarrInstance(
          sonarrInstance,
          embyInstance,
          processedItemCount,
          totalItems,
          deletionScoreSettings,
          folderSpaceData
        );
        allProcessedItems.push(...sonarrItems);
        processedItemCount += sonarrItems.length;
      } catch (error) {
        console.error(
          `Error processing Sonarr instance ${sonarrInstance.name}:`,
          error
        );
      }
    }

    // Process Radarr instances
    for (const radarrInstance of radarrInstances) {
      try {
        const radarrItems = await this.processRadarrInstance(
          radarrInstance,
          embyInstance,
          processedItemCount,
          totalItems,
          deletionScoreSettings,
          folderSpaceData
        );
        allProcessedItems.push(...radarrItems);
        processedItemCount += radarrItems.length;
      } catch (error) {
        console.error(
          `Error processing Radarr instance ${radarrInstance.name}:`,
          error
        );
      }
    }

    // Mark as complete
    const completedProgress: MediaProcessingProgress = {
      phase: 'Complete',
      current: totalItems,
      total: totalItems,
      currentItem: `Processed ${allProcessedItems.length} items`,
      percentage: 100,
      isComplete: true,
    };
    await ProgressStore.setProgress(completedProgress);

    return allProcessedItems;
  }

  private async processSonarrInstance(
    sonarrInstance: SonarrInstance,
    embyInstance: EmbySettings | null,
    processedItemCount: number,
    totalItems: number,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[]
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];

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
          embyInstance,
          this.enhancedSettings!
        );

        // Store the item immediately
        await MediaStorage.storeProcessedItem(
          processedItem,
          deletionScoreSettings,
          folderSpaceData,
          embyInstance
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
    embyInstance: EmbySettings | null,
    processedItemCount: number,
    totalItems: number,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[]
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];

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
          embyInstance,
          this.enhancedSettings!
        );

        // Store the item immediately
        await MediaStorage.storeProcessedItem(
          processedItem,
          deletionScoreSettings,
          folderSpaceData,
          embyInstance
        );

        processedItems.push(processedItem);
      } catch (error) {
        console.error(`Error processing movie ${movieData.title}:`, error);
      }
    }

    return processedItems;
  }
}
