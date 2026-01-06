export type { SonarrSeries, RadarrMovie } from '@/lib/types/arr';

export type {
  SonarrRootFolder,
  SonarrDiskSpace,
} from '../sonarr-service';

export type {
  RadarrRootFolder,
  RadarrDiskSpace,
} from '../radarr-service';

import type { SonarrRootFolder, SonarrDiskSpace } from '../sonarr-service';
import type { RadarrRootFolder, RadarrDiskSpace } from '../radarr-service';

export type RootFolderInfo = SonarrRootFolder | RadarrRootFolder;
export type DiskSpaceInfo = SonarrDiskSpace | RadarrDiskSpace;
