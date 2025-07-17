// Shared types for settings actions
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
  preferEmbyDateAdded?: boolean;
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

export interface BatchSettings {
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
}

export interface EnhancedProcessingSettings {
  enableDeletionScoring: boolean;
  enableDetailedMetadata: boolean;
  enableQualityAnalysis: boolean;
  enablePlaybackProgress: boolean;
}

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

export interface RootFolderResponse {
  path: string;
  freeSpace: number;
  totalSpace: number;
}

export interface DiskSpaceResponse {
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
