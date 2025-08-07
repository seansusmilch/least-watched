'use server';

import { sonarrSettingsService, radarrSettingsService } from '@/lib/database';
import type { FolderInfo } from './types';
import { sonarrApiClient, radarrApiClient } from '@/lib/services/arr-client';
import type { DiskSpaceInfo, RootFolderInfo } from '@/lib/services/arr-client';

// Helper function to create FolderInfo from disk space and root folder data
function createFolderInfo(
  diskSpace: DiskSpaceInfo[],
  rootFolders: RootFolderInfo[]
): FolderInfo[] {
  const folderMap = new Map<string, FolderInfo>();

  // Process disk space entries first (most complete data)
  diskSpace.forEach((ds) => {
    if (!ds.path) return;

    folderMap.set(ds.path, {
      path: ds.path,
      label: ds.label || ds.path,
      freeSpace: ds.freeSpace || 0,
      totalSpace: ds.totalSpace || 0,
      diskSpaceData: {
        hasEnhancedData: true,
        isSystemDrive: ds.path === 'C:\\' || ds.path === '/',
      },
    });
  });

  // Update with root folder data (may have different free space values)
  rootFolders.forEach((rf) => {
    if (!rf.path) return;

    const existing = folderMap.get(rf.path);
    if (existing) {
      // Update free space if available from root folder
      if (rf.freeSpace !== undefined && rf.freeSpace !== null) {
        existing.freeSpace = rf.freeSpace;
      }
    } else {
      // Add new entry if not found in disk space
      folderMap.set(rf.path, {
        path: rf.path,
        label: rf.path,
        freeSpace: rf.freeSpace || 0,
        totalSpace: 0, // Root folders don't provide total space
      });
    }
  });

  return Array.from(folderMap.values());
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
