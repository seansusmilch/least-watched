export interface MediaProcessingResult {
  success: boolean;
  message: string;
  processedItems?: number;
  error?: string;
}

export interface MediaItemData {
  id: string;
  title: string;
  type: string;
  year?: number;
  mediaPath?: string;
  sizeOnDisk?: bigint;
  dateAdded?: Date;
  lastWatched?: Date;
  source?: string;
  watchCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Enhanced fields
  quality?: string;
  qualityScore?: number;

  // TV Show specific
  episodesOnDisk?: number;
  totalEpisodes?: number;
  seasonCount?: number;
  completionPercentage?: number;

  // Monitoring and availability
  monitored?: boolean;

  // Ratings
  imdbRating?: number;
  tmdbRating?: number;

  // Play progress
  playProgress?: number;
  fullyWatched?: boolean;

  // Size efficiency
  runtime?: number;
  sizePerHour?: number;

  // Metadata
  genres?: string; // JSON string
  overview?: string;

  // Folder space tracking
  folderRemainingSpacePercent?: number;

  // Deletion score (stored in database)
  deletionScore?: number;
}

export interface FolderSpaceData {
  path: string;
  label: string;
  freeSpaceGB: number;
  totalSpaceGB?: number;
  source: string;
  type: 'tv' | 'movie';

  // Enhanced diskspace data
  diskSpaceData?: {
    percentUsed?: number;
    isSystemDrive?: boolean;
    driveFormat?: string;
    unmappedFolders?: Array<{
      name: string;
      path: string;
      size: number;
    }>;
    hasEnhancedData: boolean;
  };
}

// Simple interface for selected folders from database
export interface SelectedFolderData {
  path: string;
  source: string;
  type: 'tv' | 'movie';
  instanceName: string;
  enabled: boolean;
}

export interface SelectedFoldersFromDatabase {
  sonarrFolders: {
    instanceName: string;
    folders: string[];
    enabled: boolean;
  }[];
  radarrFolders: {
    instanceName: string;
    folders: string[];
    enabled: boolean;
  }[];
}

// Interface for folders with disk space information
export interface FolderWithSpace {
  path: string; // "D:\\TV Shows"
  instanceName: string; // "My Sonarr"
  instanceType: 'sonarr' | 'radarr';
  freeSpace: number; // in bytes
  totalSpace: number; // in bytes
  usedSpace: number; // calculated: totalSpace - freeSpace
  freeSpacePercent: number;
  usedSpacePercent: number;
  enabled: boolean; // whether the instance is enabled
}

// Enhanced interface for all folders from disk space API
export interface FolderWithSpaceEnhanced extends FolderWithSpace {
  isSelected: boolean; // Whether this folder is in selectedFolders
  isRootFolder: boolean; // Whether this is a root folder from getRootFolders
  isDiskSpaceFolder: boolean; // Whether this is from getDiskSpace
  label?: string; // Human-readable label from diskspace API
  driveFormat?: string; // File system format (NTFS, ext4, etc.)
  unmappedFolders?: Array<{
    name: string;
    path: string;
    size: number;
  }>;
  // Additional metadata for grouping
  driveRoot?: string; // Root drive path (e.g., "C:\", "/")
  isSystemDrive?: boolean; // Whether this is a system drive
}
