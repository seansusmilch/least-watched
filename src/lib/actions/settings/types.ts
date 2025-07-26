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
  daysUnwatched30DaysPercent: number; // <= 30 days (percentage of max points)
  daysUnwatched90DaysPercent: number; // 31-90 days (percentage of max points)
  daysUnwatched180DaysPercent: number; // 91-180 days (percentage of max points)
  daysUnwatched365DaysPercent: number; // 181-365 days (percentage of max points)
  daysUnwatchedOver365Percent: number; // > 365 days (percentage of max points)

  // Never Watched Bonus (max 20 points)
  neverWatchedEnabled: boolean;
  neverWatchedPoints: number;

  // Size on Disk Factor (max 30 points)
  sizeOnDiskEnabled: boolean;
  sizeOnDiskMaxPoints: number;
  sizeOnDisk1GBPercent: number; // < 1GB (percentage of max points)
  sizeOnDisk5GBPercent: number; // 1-5GB (percentage of max points)
  sizeOnDisk10GBPercent: number; // 5-10GB (percentage of max points)
  sizeOnDisk20GBPercent: number; // 10-20GB (percentage of max points)
  sizeOnDisk50GBPercent: number; // 20-50GB (percentage of max points)
  sizeOnDiskOver50GBPercent: number; // >= 50GB (percentage of max points)

  // Age Since Added Factor (max 15 points)
  ageSinceAddedEnabled: boolean;
  ageSinceAddedMaxPoints: number;
  ageSinceAdded180DaysPercent: number; // 180-365 days (percentage of max points)
  ageSinceAdded365DaysPercent: number; // 365-730 days (percentage of max points)
  ageSinceAddedOver730Percent: number; // > 730 days (percentage of max points)

  // Folder Space Factor (max 20 points)
  folderSpaceEnabled: boolean;
  folderSpaceMaxPoints: number;
  folderSpace10PercentPercent: number; // < 10% remaining (percentage of max points)
  folderSpace20PercentPercent: number; // 10-20% remaining (percentage of max points)
  folderSpace30PercentPercent: number; // 20-30% remaining (percentage of max points)
  folderSpace50PercentPercent: number; // 30-50% remaining (percentage of max points)
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
