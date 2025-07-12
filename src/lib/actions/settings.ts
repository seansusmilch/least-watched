'use server';

import { revalidatePath } from 'next/cache';
import {
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
  appSettingsService,
} from '../database';
import { apiService } from '../api';

// Types for form data
export type SonarrSettingsInput = {
  name: string;
  url: string;
  apiKey: string;
  enabled?: boolean;
  selectedFolders?: string[];
};

export type RadarrSettingsInput = {
  name: string;
  url: string;
  apiKey: string;
  enabled?: boolean;
  selectedFolders?: string[];
};

export type EmbySettingsInput = {
  name: string;
  url: string;
  apiKey: string;
  userId?: string;
  enabled?: boolean;
  selectedFolders?: string[];
};

export type AppSettingsInput = {
  key: string;
  value: string;
  description?: string;
};

export type AppSetting = {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Sonarr Settings Actions
export async function getSonarrSettings() {
  try {
    return await sonarrSettingsService.getAll();
  } catch (error) {
    console.error('Failed to get Sonarr settings:', error);
    throw new Error('Failed to get Sonarr settings');
  }
}

export async function createSonarrSetting(data: SonarrSettingsInput) {
  try {
    const setting = await sonarrSettingsService.create({
      name: data.name,
      url: data.url,
      apiKey: data.apiKey,
      enabled: data.enabled ?? true,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to create Sonarr setting:', error);
    return { success: false, error: 'Failed to create Sonarr setting' };
  }
}

export async function updateSonarrSetting(
  id: string,
  data: Partial<SonarrSettingsInput>
) {
  try {
    const setting = await sonarrSettingsService.update(id, data);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to update Sonarr setting:', error);
    return { success: false, error: 'Failed to update Sonarr setting' };
  }
}

export async function deleteSonarrSetting(id: string) {
  try {
    await sonarrSettingsService.delete(id);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Sonarr setting:', error);
    return { success: false, error: 'Failed to delete Sonarr setting' };
  }
}

export async function testSonarrConnection(id: string) {
  try {
    const setting = await sonarrSettingsService.getById(id);
    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    // Refresh API configuration to include this setting
    await apiService.refreshConfig();

    // Find the index of this setting in the enabled settings
    const enabledSettings = await sonarrSettingsService.getEnabled();
    const configIndex = enabledSettings.findIndex((s) => s.id === id);

    if (configIndex === -1) {
      return { success: false, error: 'Setting not enabled' };
    }

    const isConnected = await apiService.testSonarrConnection(configIndex);
    return { success: isConnected, connected: isConnected };
  } catch (error) {
    console.error('Failed to test Sonarr connection:', error);
    return { success: false, error: 'Failed to test connection' };
  }
}

// Radarr Settings Actions
export async function getRadarrSettings() {
  try {
    return await radarrSettingsService.getAll();
  } catch (error) {
    console.error('Failed to get Radarr settings:', error);
    throw new Error('Failed to get Radarr settings');
  }
}

export async function createRadarrSetting(data: RadarrSettingsInput) {
  try {
    const setting = await radarrSettingsService.create({
      name: data.name,
      url: data.url,
      apiKey: data.apiKey,
      enabled: data.enabled ?? true,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to create Radarr setting:', error);
    return { success: false, error: 'Failed to create Radarr setting' };
  }
}

export async function updateRadarrSetting(
  id: string,
  data: Partial<RadarrSettingsInput>
) {
  try {
    const setting = await radarrSettingsService.update(id, data);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to update Radarr setting:', error);
    return { success: false, error: 'Failed to update Radarr setting' };
  }
}

export async function deleteRadarrSetting(id: string) {
  try {
    await radarrSettingsService.delete(id);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Radarr setting:', error);
    return { success: false, error: 'Failed to delete Radarr setting' };
  }
}

export async function testRadarrConnection(id: string) {
  try {
    const setting = await radarrSettingsService.getById(id);
    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    // Find the index of this setting in the enabled settings
    const enabledSettings = await radarrSettingsService.getEnabled();
    const configIndex = enabledSettings.findIndex((s) => s.id === id);

    if (configIndex === -1) {
      return { success: false, error: 'Setting not enabled' };
    }

    const isConnected = await apiService.testRadarrConnection(configIndex);
    return { success: isConnected, connected: isConnected };
  } catch (error) {
    console.error('Failed to test Radarr connection:', error);
    return { success: false, error: 'Failed to test connection' };
  }
}

// Emby Settings Actions
export async function getEmbySettings() {
  try {
    return await embySettingsService.getAll();
  } catch (error) {
    console.error('Failed to get Emby settings:', error);
    throw new Error('Failed to get Emby settings');
  }
}

export async function createEmbySetting(data: EmbySettingsInput) {
  try {
    const setting = await embySettingsService.create({
      name: data.name,
      url: data.url,
      apiKey: data.apiKey,
      userId: data.userId,
      enabled: data.enabled ?? true,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to create Emby setting:', error);
    return { success: false, error: 'Failed to create Emby setting' };
  }
}

export async function updateEmbySetting(
  id: string,
  data: Partial<EmbySettingsInput>
) {
  try {
    const setting = await embySettingsService.update(id, data);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to update Emby setting:', error);
    return { success: false, error: 'Failed to update Emby setting' };
  }
}

export async function deleteEmbySetting(id: string) {
  try {
    await embySettingsService.delete(id);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Emby setting:', error);
    return { success: false, error: 'Failed to delete Emby setting' };
  }
}

export async function testEmbyConnection(id: string) {
  try {
    const setting = await embySettingsService.getById(id);
    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    // Find the index of this setting in the enabled settings
    const enabledSettings = await embySettingsService.getEnabled();
    const configIndex = enabledSettings.findIndex((s) => s.id === id);

    if (configIndex === -1) {
      return { success: false, error: 'Setting not enabled' };
    }

    const isConnected = await apiService.testEmbyConnection(configIndex);
    return { success: isConnected, connected: isConnected };
  } catch (error) {
    console.error('Failed to test Emby connection:', error);
    return { success: false, error: 'Failed to test connection' };
  }
}

// App Settings Actions
export async function getAppSettings() {
  try {
    return await appSettingsService.getAll();
  } catch (error) {
    console.error('Failed to get app settings:', error);
    throw new Error('Failed to get app settings');
  }
}

export async function getAppSetting(key: string) {
  try {
    return await appSettingsService.getByKey(key);
  } catch (error) {
    console.error('Failed to get app setting:', error);
    throw new Error('Failed to get app setting');
  }
}

export async function setAppSetting(data: AppSettingsInput) {
  try {
    const setting = await appSettingsService.setValue(
      data.key,
      data.value,
      data.description
    );

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to set app setting:', error);
    return { success: false, error: 'Failed to set app setting' };
  }
}

export async function deleteAppSetting(key: string) {
  try {
    await appSettingsService.delete(key);

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete app setting:', error);
    return { success: false, error: 'Failed to delete app setting' };
  }
}

export interface BatchSettings {
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
}

export async function getBatchSettings(): Promise<BatchSettings> {
  try {
    const batchSize =
      (await appSettingsService.getValue('batch_size', '50')) || '50';
    const delayBetweenBatches =
      (await appSettingsService.getValue('batch_delay', '1000')) || '1000';

    return {
      batchSize: parseInt(batchSize, 10),
      delayBetweenBatches: parseInt(delayBetweenBatches, 10),
    };
  } catch (error) {
    console.error('Error getting batch settings:', error);
    return {
      batchSize: 50,
      delayBetweenBatches: 1000,
    };
  }
}

export async function setBatchSettings(
  settings: BatchSettings
): Promise<{ success: boolean; message: string }> {
  try {
    await setAppSetting({
      key: 'batchSize',
      value: settings.batchSize.toString(),
      description: 'Number of items to process in each batch',
    });

    await setAppSetting({
      key: 'delayBetweenBatches',
      value: settings.delayBetweenBatches.toString(),
      description: 'Delay between batches in milliseconds',
    });

    revalidatePath('/settings');
    return { success: true, message: 'Batch settings updated successfully' };
  } catch (error) {
    console.error('Failed to set batch settings:', error);
    return { success: false, message: 'Failed to update batch settings' };
  }
}

// Enhanced Media Processing Settings
export interface EnhancedProcessingSettings {
  enableDeletionScoring: boolean;
  enableDetailedMetadata: boolean;
  enableQualityAnalysis: boolean;
  enablePlaybackProgress: boolean;
}

export async function getEnhancedProcessingSettings(): Promise<EnhancedProcessingSettings> {
  try {
    const [
      deletionScoring,
      detailedMetadata,
      qualityAnalysis,
      playbackProgress,
    ] = await Promise.all([
      getAppSetting('enableDeletionScoring'),
      getAppSetting('enableDetailedMetadata'),
      getAppSetting('enableQualityAnalysis'),
      getAppSetting('enablePlaybackProgress'),
    ]);

    return {
      enableDeletionScoring: deletionScoring
        ? deletionScoring.value === 'true'
        : true,
      enableDetailedMetadata: detailedMetadata
        ? detailedMetadata.value === 'true'
        : true,
      enableQualityAnalysis: qualityAnalysis
        ? qualityAnalysis.value === 'true'
        : true,
      enablePlaybackProgress: playbackProgress
        ? playbackProgress.value === 'true'
        : true,
    };
  } catch (error) {
    console.error('Failed to get enhanced processing settings:', error);
    // Return defaults
    return {
      enableDeletionScoring: true,
      enableDetailedMetadata: true,
      enableQualityAnalysis: true,
      enablePlaybackProgress: true,
    };
  }
}

export async function setEnhancedProcessingSettings(
  settings: EnhancedProcessingSettings
): Promise<{ success: boolean; message: string }> {
  try {
    await Promise.all([
      setAppSetting({
        key: 'enableDeletionScoring',
        value: settings.enableDeletionScoring.toString(),
        description: 'Enable deletion priority scoring for media items',
      }),
      setAppSetting({
        key: 'enableDetailedMetadata',
        value: settings.enableDetailedMetadata.toString(),
        description: 'Fetch detailed metadata (ratings, genres, overview)',
      }),
      setAppSetting({
        key: 'enableQualityAnalysis',
        value: settings.enableQualityAnalysis.toString(),
        description:
          'Analyze quality profiles and calculate efficiency metrics',
      }),
      setAppSetting({
        key: 'enablePlaybackProgress',
        value: settings.enablePlaybackProgress.toString(),
        description: 'Fetch detailed playback progress from Emby',
      }),
    ]);

    revalidatePath('/settings');
    return {
      success: true,
      message: 'Enhanced processing settings updated successfully',
    };
  } catch (error) {
    console.error('Failed to set enhanced processing settings:', error);
    return {
      success: false,
      message: 'Failed to update enhanced processing settings',
    };
  }
}

// Deletion Score Settings
export interface DeletionScoreSettings {
  enabled: boolean;

  // Days Unwatched Factor (max 35 points)
  daysUnwatchedEnabled: boolean;
  daysUnwatchedMaxPoints: number;
  daysUnwatched30Days: number; // <= 30 days
  daysUnwatched90Days: number; // 31-90 days
  daysUnwatched180Days: number; // 91-180 days
  daysUnwatched365Days: number; // 181-365 days
  daysUnwatchedOver365: number; // > 365 days

  // Never Watched Bonus (max 20 points)
  neverWatchedEnabled: boolean;
  neverWatchedPoints: number;

  // Size on Disk Factor (max 30 points)
  sizeOnDiskEnabled: boolean;
  sizeOnDiskMaxPoints: number;
  sizeOnDisk1GB: number; // < 1GB
  sizeOnDisk5GB: number; // 1-5GB
  sizeOnDisk10GB: number; // 5-10GB
  sizeOnDisk20GB: number; // 10-20GB
  sizeOnDisk50GB: number; // 20-50GB
  sizeOnDiskOver50GB: number; // >= 50GB

  // Age Since Added Factor (max 15 points)
  ageSinceAddedEnabled: boolean;
  ageSinceAddedMaxPoints: number;
  ageSinceAdded180Days: number; // 180-365 days
  ageSinceAdded365Days: number; // 365-730 days
  ageSinceAddedOver730: number; // > 730 days

  // Folder Space Factor (max 20 points)
  folderSpaceEnabled: boolean;
  folderSpaceMaxPoints: number;
  folderSpace10Percent: number; // < 10% remaining
  folderSpace20Percent: number; // 10-20% remaining
  folderSpace30Percent: number; // 20-30% remaining
  folderSpace50Percent: number; // 30-50% remaining
}

export async function getDeletionScoreSettings(): Promise<DeletionScoreSettings> {
  try {
    const setting = await getAppSetting('deletionScoreSettings');

    if (setting?.value) {
      return JSON.parse(setting.value);
    }

    // Return defaults that match current hardcoded values
    return {
      enabled: true,

      // Days Unwatched Factor
      daysUnwatchedEnabled: true,
      daysUnwatchedMaxPoints: 35,
      daysUnwatched30Days: 0,
      daysUnwatched90Days: 10,
      daysUnwatched180Days: 15,
      daysUnwatched365Days: 25,
      daysUnwatchedOver365: 35,

      // Never Watched Bonus
      neverWatchedEnabled: true,
      neverWatchedPoints: 20,

      // Size on Disk Factor
      sizeOnDiskEnabled: true,
      sizeOnDiskMaxPoints: 30,
      sizeOnDisk1GB: 0,
      sizeOnDisk5GB: 10,
      sizeOnDisk10GB: 15,
      sizeOnDisk20GB: 20,
      sizeOnDisk50GB: 25,
      sizeOnDiskOver50GB: 30,

      // Age Since Added Factor
      ageSinceAddedEnabled: true,
      ageSinceAddedMaxPoints: 15,
      ageSinceAdded180Days: 5,
      ageSinceAdded365Days: 10,
      ageSinceAddedOver730: 15,

      // Folder Space Factor
      folderSpaceEnabled: true,
      folderSpaceMaxPoints: 20,
      folderSpace10Percent: 20,
      folderSpace20Percent: 15,
      folderSpace30Percent: 10,
      folderSpace50Percent: 5,
    };
  } catch (error) {
    console.error('Failed to get deletion score settings:', error);
    // Return defaults on error
    return await getDeletionScoreSettings();
  }
}

export async function setDeletionScoreSettings(
  settings: DeletionScoreSettings
): Promise<{ success: boolean; message: string }> {
  try {
    await setAppSetting({
      key: 'deletionScoreSettings',
      value: JSON.stringify(settings),
      description:
        'Deletion score calculation settings for media prioritization',
    });

    // Invalidate deletion score cache when settings change
    const { deletionScoreCalculator } = await import(
      '../deletion-score-calculator'
    );
    deletionScoreCalculator.invalidateCache();

    // Trigger recalculation in the background if deletion scoring is enabled
    if (settings.enabled) {
      // Import and trigger recalculation without waiting for completion
      const { deletionScoreService } = await import(
        '../services/deletion-score-service'
      );

      // Fire and forget - don't wait for completion
      deletionScoreService.recalculateAllDeletionScores().catch((error) => {
        console.error('Background deletion score recalculation failed:', error);
      });
    }

    revalidatePath('/settings');
    return {
      success: true,
      message:
        'Deletion score settings updated successfully. Scores are being recalculated in the background.',
    };
  } catch (error) {
    console.error('Failed to set deletion score settings:', error);
    return {
      success: false,
      message: 'Failed to update deletion score settings',
    };
  }
}

export async function fetchFolders(
  instanceId: string,
  instanceType: 'Radarr' | 'Sonarr'
): Promise<{ success: boolean; data?: FolderInfo[]; error?: string }> {
  try {
    let folders: FolderInfo[] = [];
    if (instanceType === 'Sonarr') {
      folders = await getSonarrFolders(instanceId);
    } else if (instanceType === 'Radarr') {
      folders = await getRadarrFolders(instanceId);
    }
    return { success: true, data: folders };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(
      `Failed to fetch folders for ${instanceType} instance ${instanceId}:`,
      errorMessage
    );
    return {
      success: false,
      error: `Failed to fetch folders: ${errorMessage}`,
    };
  }
}

export interface FolderInfo {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
  diskSpaceData?: {
    hasEnhancedData: boolean;
    isSystemDrive: boolean;
  };
}

interface RootFolderResponse {
  path: string;
  freeSpace: number;
  totalSpace: number;
}

interface DiskSpaceResponse {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
  percentUsed?: number;
  driveFormat?: string;
  unmappedFolders?: Array<{
    name: string;
    path: string;
    size: number;
  }>;
}

export async function getSonarrFolders(id: string): Promise<FolderInfo[]> {
  try {
    const setting = await sonarrSettingsService.getById(id);
    if (!setting) {
      throw new Error('Sonarr instance not found');
    }

    const [rootFolderResponse, diskSpaceResponse] = await Promise.all([
      fetch(`${setting.url}/api/v3/rootfolder`, {
        headers: { 'X-Api-Key': setting.apiKey },
      }),
      fetch(`${setting.url}/api/v3/diskspace`, {
        headers: { 'X-Api-Key': setting.apiKey },
      }),
    ]);

    if (!rootFolderResponse.ok) {
      throw new Error(
        `Failed to fetch root folders: ${rootFolderResponse.statusText}`
      );
    }
    if (!diskSpaceResponse.ok) {
      throw new Error(
        `Failed to fetch disk space: ${diskSpaceResponse.statusText}`
      );
    }

    const rootFolders: RootFolderResponse[] = await rootFolderResponse.json();
    const diskSpace: DiskSpaceResponse[] = await diskSpaceResponse.json();
    const folderMap = new Map<string, FolderInfo>();

    // First, process all available disk space entries
    diskSpace.forEach((ds) => {
      folderMap.set(ds.path, {
        path: ds.path,
        label: ds.label || ds.path,
        freeSpace: ds.freeSpace,
        totalSpace: ds.totalSpace,
        diskSpaceData: {
          hasEnhancedData: true,
          isSystemDrive: ds.path === 'C:\\' || ds.path === '/',
        },
      });
    });

    // Then, update with more specific info from root folders
    rootFolders.forEach((rf) => {
      const existing = folderMap.get(rf.path);
      if (existing) {
        // Update existing entry with root folder data
        existing.freeSpace = rf.freeSpace;
        existing.totalSpace = rf.totalSpace;
      } else {
        // Add if not found in diskspace (edge case)
        folderMap.set(rf.path, {
          path: rf.path,
          label: rf.path,
          freeSpace: rf.freeSpace,
          totalSpace: rf.totalSpace,
        });
      }
    });

    return Array.from(folderMap.values());
  } catch (error) {
    console.error('Failed to get Sonarr folders:', error);
    throw error;
  }
}

export async function getRadarrFolders(id: string): Promise<FolderInfo[]> {
  try {
    const setting = await radarrSettingsService.getById(id);
    if (!setting) {
      throw new Error('Radarr instance not found');
    }

    const [rootFolderResponse, diskSpaceResponse] = await Promise.all([
      fetch(`${setting.url}/api/v3/rootfolder`, {
        headers: { 'X-Api-Key': setting.apiKey },
      }),
      fetch(`${setting.url}/api/v3/diskspace`, {
        headers: { 'X-Api-Key': setting.apiKey },
      }),
    ]);

    if (!rootFolderResponse.ok) {
      throw new Error(
        `Failed to fetch root folders: ${rootFolderResponse.statusText}`
      );
    }
    if (!diskSpaceResponse.ok) {
      throw new Error(
        `Failed to fetch disk space: ${diskSpaceResponse.statusText}`
      );
    }

    const rootFolders: RootFolderResponse[] = await rootFolderResponse.json();
    const diskSpace: DiskSpaceResponse[] = await diskSpaceResponse.json();
    const folderMap = new Map<string, FolderInfo>();

    // First, process all available disk space entries
    diskSpace.forEach((ds) => {
      folderMap.set(ds.path, {
        path: ds.path,
        label: ds.label || ds.path,
        freeSpace: ds.freeSpace,
        totalSpace: ds.totalSpace,
        diskSpaceData: {
          hasEnhancedData: true,
          isSystemDrive: ds.path === 'C:\\' || ds.path === '/',
        },
      });
    });

    // Then, update with more specific info from root folders
    rootFolders.forEach((rf) => {
      const existing = folderMap.get(rf.path);
      if (existing) {
        // Update existing entry with root folder data
        existing.freeSpace = rf.freeSpace;
        existing.totalSpace = rf.totalSpace;
      } else {
        // Add if not found in diskspace (edge case)
        folderMap.set(rf.path, {
          path: rf.path,
          label: rf.path,
          freeSpace: rf.freeSpace,
          totalSpace: rf.totalSpace,
        });
      }
    });

    return Array.from(folderMap.values());
  } catch (error) {
    console.error('Failed to get Radarr folders:', error);
    throw error;
  }
}
