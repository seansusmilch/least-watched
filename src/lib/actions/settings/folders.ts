'use server';

import { sonarrSettingsService, radarrSettingsService } from '../../database';
import type {
  FolderInfo,
  RootFolderResponse,
  DiskSpaceResponse,
} from './types';

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
