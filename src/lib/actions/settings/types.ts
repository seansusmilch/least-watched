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

export interface Breakpoint {
  value: number;
  percent: number;
}

export interface DeletionScoreSettings {
  enabled: boolean;

  // Days Unwatched Factor
  daysUnwatchedEnabled: boolean;
  daysUnwatchedMaxPoints: number;
  daysUnwatchedBreakpoints: Breakpoint[];

  // Never Watched Bonus
  neverWatchedEnabled: boolean;
  neverWatchedPoints: number;

  // Size on Disk Factor
  sizeOnDiskEnabled: boolean;
  sizeOnDiskMaxPoints: number;
  sizeOnDiskBreakpoints: Breakpoint[];

  // Age Since Added Factor
  ageSinceAddedEnabled: boolean;
  ageSinceAddedMaxPoints: number;
  ageSinceAddedBreakpoints: Breakpoint[];

  // Folder Space Factor
  folderSpaceEnabled: boolean;
  folderSpaceMaxPoints: number;
  folderSpaceBreakpoints: Breakpoint[];
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
