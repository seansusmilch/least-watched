'use server';

import { sonarrSettingsService, radarrSettingsService } from '@/lib/database';
import type { FolderInfo } from '@/lib/types/settings';
import { sonarrApiClient } from '@/lib/services/sonarr-service';
import { radarrApiClient } from '@/lib/services/radarr-service';
import type {
  DiskSpaceInfo,
  RootFolderInfo,
} from '@/lib/services/shared/arr-types';
import { normalizeFolderPath } from '@/lib/utils/selected-paths';

// Helper function to create FolderInfo from disk space and root folder data
function createFolderInfo(
  diskSpace: DiskSpaceInfo[],
  rootFolders: RootFolderInfo[]
): FolderInfo[] {
  const diskSpaceWithPaths = diskSpace.filter(
    (ds): ds is DiskSpaceInfo & { path: string } => Boolean(ds.path)
  );

  const findBestDiskSpaceMatch = (
    folderPath: string
  ): (DiskSpaceInfo & { path: string }) | undefined => {
    const exact = diskSpaceWithPaths.find((ds) => ds.path === folderPath);
    if (exact) return exact;

    const byPrefix = diskSpaceWithPaths.find((ds) => folderPath.startsWith(ds.path));
    if (byPrefix) return byPrefix;

    return diskSpaceWithPaths.find((ds) => ds.path.startsWith(folderPath));
  };

  const seenRootFolderKeys = new Set<string>();

  return rootFolders
    .filter((rf): rf is RootFolderInfo & { path: string } => Boolean(rf.path))
    .filter((rf) => {
      const key = normalizeFolderPath(rf.path);
      if (!key) return false;
      if (seenRootFolderKeys.has(key)) return false;
      seenRootFolderKeys.add(key);
      return true;
    })
    .map((rf) => {
      const matchingDiskSpace = findBestDiskSpaceMatch(rf.path);
      const freeSpace =
        rf.freeSpace !== undefined && rf.freeSpace !== null
          ? rf.freeSpace
          : matchingDiskSpace?.freeSpace || 0;

      const totalSpace = matchingDiskSpace?.totalSpace || 0;

      return {
        path: rf.path,
        label: rf.path,
        freeSpace,
        totalSpace,
        diskSpaceData: matchingDiskSpace?.path
          ? {
              hasEnhancedData: true,
              isSystemDrive:
                matchingDiskSpace.path === 'C:\\' || matchingDiskSpace.path === '/',
            }
          : undefined,
      };
    });
}

export async function fetchFolders(
  instanceId: string,
  instanceType: 'Radarr' | 'Sonarr'
): Promise<{ success: boolean; data?: FolderInfo[]; error?: string }> {
  try {
    const folders =
      instanceType === 'Sonarr'
        ? await getSonarrFolders(instanceId)
        : await getRadarrFolders(instanceId);

    return { success: true, data: folders };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(
      `Failed to fetch ${instanceType} folders for instance ${instanceId}:`,
      errorMessage
    );

    return {
      success: false,
      error: `Failed to fetch folders: ${errorMessage}`,
    };
  }
}

export async function getSonarrFolders(id: string): Promise<FolderInfo[]> {
  const setting = await sonarrSettingsService.getById(id);
  if (!setting) {
    throw new Error('Sonarr instance not found');
  }

  const [rootFolders, diskSpace] = await Promise.all([
    sonarrApiClient.getRootFolders(setting),
    sonarrApiClient.getDiskSpace(setting),
  ]);

  return createFolderInfo(diskSpace, rootFolders);
}

export async function getRadarrFolders(id: string): Promise<FolderInfo[]> {
  const setting = await radarrSettingsService.getById(id);
  if (!setting) {
    throw new Error('Radarr instance not found');
  }

  const [rootFolders, diskSpace] = await Promise.all([
    radarrApiClient.getRootFolders(setting),
    radarrApiClient.getDiskSpace(setting),
  ]);

  return createFolderInfo(diskSpace, rootFolders);
}
