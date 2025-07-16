import {
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
} from '../database';
import { type EnhancedProcessingSettings } from '../actions/settings';
import { type DeletionScoreSettings } from '../actions/settings/types';
import { folderSpaceService } from '../services/folder-space-service';
import { type FolderSpaceData } from '../types/media-processing';
import { ProgressStore } from '../progress-store';
import { TESTING_LIMIT } from './constants';
import { SonarrProcessor } from './sonarr-processor';
import { RadarrProcessor } from './radarr-processor';
import { MediaStorage } from './storage';
import {
  type MediaProcessingProgress,
  type ProcessedMediaItem,
  type StoredMediaItem,
} from './types';

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
      const { getEnhancedProcessingSettings } = await import(
        '../actions/settings'
      );
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

  static async getProgress(): Promise<MediaProcessingProgress | null> {
    return await ProgressStore.getProgress();
  }

  static async clearProgress(): Promise<void> {
    await ProgressStore.clearProgress();
  }

  static async getActiveProcess(): Promise<MediaProcessingProgress | null> {
    return await ProgressStore.getActiveProcess();
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
    const [sonarrInstances, radarrInstances, embyInstances] = await Promise.all(
      [
        sonarrSettingsService.getEnabled(),
        radarrSettingsService.getEnabled(),
        embySettingsService.getEnabled(),
      ]
    );

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
        const response = await fetch(`${sonarrInstance.url}/api/v3/series`, {
          headers: { 'X-Api-Key': sonarrInstance.apiKey },
        });
        if (response.ok) {
          const series = await response.json();
          totalItems += Math.min(series.length, TESTING_LIMIT);
        }
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
        const response = await fetch(`${radarrInstance.url}/api/v3/movie`, {
          headers: { 'X-Api-Key': radarrInstance.apiKey },
        });
        if (response.ok) {
          const movies = await response.json();
          totalItems += Math.min(movies.length, TESTING_LIMIT);
        }
      } catch (error) {
        console.error(
          `Error counting Radarr items for ${radarrInstance.name}:`,
          error
        );
      }
    }

    let processedItemCount = 0;

    // Get deletion score settings and folder space data for scoring (load once)
    const { getDeletionScoreSettings } = await import('../actions/settings');
    const deletionScoreSettings: DeletionScoreSettings =
      await getDeletionScoreSettings();
    const folderSpaceData = await folderSpaceService.getFolderSpaceData();

    // Process Sonarr instances
    for (const sonarrInstance of sonarrInstances) {
      try {
        const sonarrItems = await this.processSonarrInstance(
          sonarrInstance,
          embyInstances,
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
          embyInstances,
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
    sonarrInstance: import('./types').SonarrInstance,
    embyInstances: import('./types').EmbyInstance[],
    processedItemCount: number,
    totalItems: number,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[]
  ): Promise<ProcessedMediaItem[]> {
    // Process using SonarrProcessor
    const processedItems = await SonarrProcessor.processInstance(
      sonarrInstance,
      embyInstances,
      this.enhancedSettings!
    );

    // Update progress and store items
    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      const currentItemIndex = processedItemCount + i + 1;

      await this.updateProgress(
        'Processing TV Shows',
        currentItemIndex,
        totalItems,
        `Processing: ${item.title}`
      );

      // Store the item
      await MediaStorage.storeProcessedItem(
        item,
        deletionScoreSettings,
        folderSpaceData
      );
    }

    return processedItems;
  }

  private async processRadarrInstance(
    radarrInstance: import('./types').RadarrInstance,
    embyInstances: import('./types').EmbyInstance[],
    processedItemCount: number,
    totalItems: number,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[]
  ): Promise<ProcessedMediaItem[]> {
    // Process using RadarrProcessor
    const processedItems = await RadarrProcessor.processInstance(
      radarrInstance,
      embyInstances,
      this.enhancedSettings!
    );

    // Update progress and store items
    for (let i = 0; i < processedItems.length; i++) {
      const item = processedItems[i];
      const currentItemIndex = processedItemCount + i + 1;

      await this.updateProgress(
        'Processing Movies',
        currentItemIndex,
        totalItems,
        `Processing: ${item.title}`
      );

      // Store the item
      await MediaStorage.storeProcessedItem(
        item,
        deletionScoreSettings,
        folderSpaceData
      );
    }

    return processedItems;
  }

  async getStoredMediaItems(): Promise<StoredMediaItem[]> {
    return MediaStorage.getStoredMediaItems();
  }
}
