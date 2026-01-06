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
  enabled?: boolean;
  selectedLibraries?: string[];
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
  delayBetweenBatches: number;
}

export interface Breakpoint {
  value: number;
  percent: number;
}

export interface DeletionScoreSettings {
  enabled: boolean;

  daysUnwatchedEnabled: boolean;
  daysUnwatchedMaxPoints: number;
  daysUnwatchedBreakpoints: Breakpoint[];

  neverWatchedEnabled: boolean;
  neverWatchedPoints: number;

  sizeOnDiskEnabled: boolean;
  sizeOnDiskMaxPoints: number;
  sizeOnDiskBreakpoints: Breakpoint[];

  ageSinceAddedEnabled: boolean;
  ageSinceAddedMaxPoints: number;
  ageSinceAddedBreakpoints: Breakpoint[];

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

export interface ScoringFactor {
  key: string;
  title: string;
  description: string;
  enabledKey: keyof DeletionScoreSettings;
  maxPointsKey: keyof DeletionScoreSettings;
  maxPoints: number;
  color: string;
  breakdownsKey?: keyof DeletionScoreSettings;
  breakdownUnit?: string;
}
