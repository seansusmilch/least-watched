// Re-export types from both services for backward compatibility
export type {
  SonarrSeries,
  SonarrRootFolder,
  SonarrDiskSpace,
} from '../sonarr-service';

export type {
  RadarrMovie,
  RadarrRootFolder,
  RadarrDiskSpace,
} from '../radarr-service';

// Import types for union types
import type { SonarrRootFolder, SonarrDiskSpace } from '../sonarr-service';
import type { RadarrRootFolder, RadarrDiskSpace } from '../radarr-service';

// Union types for backward compatibility
export type RootFolderInfo = SonarrRootFolder | RadarrRootFolder;
export type DiskSpaceInfo = SonarrDiskSpace | RadarrDiskSpace;
