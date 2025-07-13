import { unstable_cache, revalidateTag } from 'next/cache';
import { mediaService } from '../services/media-service';
import { folderSpaceService } from '../services/folder-space-service';
import { sonarrApiClient, radarrApiClient } from '../services/api-client';
import {
  type CachedMediaItemData,
  type FolderSpaceData,
  type FolderWithSpace,
  type FolderWithSpaceEnhanced,
} from '../types/cached-data';

// Cache tags for different data types
export const CACHE_TAGS = {
  MEDIA_ITEMS: 'media-items',
  FOLDER_SPACE: 'folder-space',
  FOLDER_SPACE_ENHANCED: 'folder-space-enhanced',
  FOLDER_SPACE_SELECTED: 'folder-space-selected',
  SONARR_DATA: 'sonarr-data',
  RADARR_DATA: 'radarr-data',
  EMBY_DATA: 'emby-data',
} as const;

// Cache duration constants (in seconds)
export const CACHE_DURATION = {
  MEDIA_ITEMS: 60, // 1 minute
  FOLDER_SPACE: 180, // 3 minutes
  API_DATA: 60, // 1 minute
  SETTINGS: 60, // 1 minute
} as const;

// ============================================================================
// Media Items Caching
// ============================================================================

/**
 * Get cached media items from database
 */
export const getCachedMediaItems = unstable_cache(
  async (): Promise<CachedMediaItemData[]> => {
    console.log('🔄 Cache miss: Fetching media items from database');
    const items = await mediaService.getMediaItems();

    // Convert BigInt to number and Dates to ISO strings for serialization
    return items.map((item) => {
      const {
        sizeOnDisk,
        dateAdded,
        lastWatched,
        createdAt,
        updatedAt,
        ...rest
      } = item;
      return {
        ...rest,
        sizeOnDisk: sizeOnDisk ? Number(sizeOnDisk) : undefined,
        dateAdded: dateAdded ? dateAdded.toISOString() : undefined,
        lastWatched: lastWatched ? lastWatched.toISOString() : undefined,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      } as CachedMediaItemData;
    });
  },
  ['media-items'],
  {
    tags: [CACHE_TAGS.MEDIA_ITEMS],
    revalidate: CACHE_DURATION.MEDIA_ITEMS,
  }
);

/**
 * Get cached media items with scores
 */
export const getCachedMediaItemsWithScores = unstable_cache(
  async (): Promise<CachedMediaItemData[]> => {
    console.log(
      '🔄 Cache miss: Fetching media items with scores from database'
    );
    const items = await mediaService.getMediaItemsWithScores();

    // Convert BigInt to number and Dates to ISO strings for serialization
    return items.map((item) => {
      const {
        sizeOnDisk,
        dateAdded,
        lastWatched,
        createdAt,
        updatedAt,
        ...rest
      } = item;
      return {
        ...rest,
        sizeOnDisk: sizeOnDisk ? Number(sizeOnDisk) : undefined,
        dateAdded: dateAdded ? dateAdded.toISOString() : undefined,
        lastWatched: lastWatched ? lastWatched.toISOString() : undefined,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      } as CachedMediaItemData;
    });
  },
  ['media-items-with-scores'],
  {
    tags: [CACHE_TAGS.MEDIA_ITEMS],
    revalidate: CACHE_DURATION.MEDIA_ITEMS,
  }
);

// ============================================================================
// Folder Space Caching
// ============================================================================

/**
 * Get cached folder space data
 */
export const getCachedFolderSpaceData = unstable_cache(
  async (): Promise<FolderSpaceData[]> => {
    console.log('🔄 Cache miss: Fetching folder space data from APIs');
    return await folderSpaceService.getFolderSpaceData();
  },
  ['folder-space-data'],
  {
    tags: [
      CACHE_TAGS.FOLDER_SPACE,
      CACHE_TAGS.SONARR_DATA,
      CACHE_TAGS.RADARR_DATA,
    ],
    revalidate: CACHE_DURATION.FOLDER_SPACE,
  }
);

/**
 * Get cached selected folders with space information
 */
export const getCachedSelectedFoldersWithSpace = unstable_cache(
  async (): Promise<FolderWithSpace[]> => {
    console.log(
      '🔄 Cache miss: Fetching selected folders with space information'
    );

    const { sonarrSettingsService, radarrSettingsService } = await import(
      '../database'
    );
    const [sonarrInstances, radarrInstances] = await Promise.all([
      sonarrSettingsService.getEnabled(),
      radarrSettingsService.getEnabled(),
    ]);

    const foldersWithSpace: FolderWithSpace[] = [];

    // Process Sonarr instances
    for (const instance of sonarrInstances) {
      try {
        const selectedFolders = instance.selectedFolders
          ? JSON.parse(instance.selectedFolders)
          : [];

        if (selectedFolders.length === 0) continue;

        const rootFolders = await sonarrApiClient.getRootFolders(instance);
        const matchingFolders = rootFolders.filter((folder) =>
          selectedFolders.includes(folder.path)
        );

        for (const folder of matchingFolders) {
          const totalSpace = folder.totalSpace || 0;
          const freeSpace = folder.freeSpace || 0;
          const usedSpace = totalSpace - freeSpace;

          foldersWithSpace.push({
            path: folder.path,
            instanceName: instance.name,
            instanceType: 'sonarr',
            freeSpace,
            totalSpace,
            usedSpace,
            freeSpacePercent:
              totalSpace > 0 ? (freeSpace / totalSpace) * 100 : 0,
            usedSpacePercent:
              totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
            enabled: instance.enabled,
          });
        }
      } catch (error) {
        console.error(
          `❌ Error fetching disk space from Sonarr ${instance.name}:`,
          error
        );
      }
    }

    // Process Radarr instances
    for (const instance of radarrInstances) {
      try {
        const selectedFolders = instance.selectedFolders
          ? JSON.parse(instance.selectedFolders)
          : [];

        if (selectedFolders.length === 0) continue;

        const rootFolders = await radarrApiClient.getRootFolders(instance);
        const matchingFolders = rootFolders.filter((folder) =>
          selectedFolders.includes(folder.path)
        );

        for (const folder of matchingFolders) {
          const totalSpace = folder.totalSpace || 0;
          const freeSpace = folder.freeSpace || 0;
          const usedSpace = totalSpace - freeSpace;

          foldersWithSpace.push({
            path: folder.path,
            instanceName: instance.name,
            instanceType: 'radarr',
            freeSpace,
            totalSpace,
            usedSpace,
            freeSpacePercent:
              totalSpace > 0 ? (freeSpace / totalSpace) * 100 : 0,
            usedSpacePercent:
              totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
            enabled: instance.enabled,
          });
        }
      } catch (error) {
        console.error(
          `❌ Error fetching disk space from Radarr ${instance.name}:`,
          error
        );
      }
    }

    return foldersWithSpace;
  },
  ['selected-folders-with-space'],
  {
    tags: [
      CACHE_TAGS.FOLDER_SPACE_SELECTED,
      CACHE_TAGS.SONARR_DATA,
      CACHE_TAGS.RADARR_DATA,
    ],
    revalidate: CACHE_DURATION.FOLDER_SPACE,
  }
);

/**
 * Get cached all folders with enhanced space information
 */
export const getCachedAllFoldersWithSpace = unstable_cache(
  async (): Promise<FolderWithSpaceEnhanced[]> => {
    console.log(
      '🔄 Cache miss: Fetching all folders with enhanced space information'
    );

    const { sonarrSettingsService, radarrSettingsService } = await import(
      '../database'
    );
    const [sonarrInstances, radarrInstances] = await Promise.all([
      sonarrSettingsService.getEnabled(),
      radarrSettingsService.getEnabled(),
    ]);

    const allFoldersWithSpace: FolderWithSpaceEnhanced[] = [];

    // Helper functions
    const getDriveRoot = (path: string): string => {
      if (path.match(/^[A-Za-z]:\\/)) {
        return path.substring(0, 3);
      }
      return path.split('/')[0] || '/';
    };

    const isSystemDrive = (path: string): boolean => {
      return path.startsWith('C:\\') || path === '/';
    };

    // Process Sonarr instances
    for (const instance of sonarrInstances) {
      try {
        const selectedFolders = instance.selectedFolders
          ? JSON.parse(instance.selectedFolders)
          : [];

        const [rootFolders, diskSpaceData] = await Promise.all([
          sonarrApiClient.getRootFolders(instance),
          sonarrApiClient.getDiskSpace(instance),
        ]);

        const folderMap = new Map<string, FolderWithSpaceEnhanced>();

        // Process root folders
        for (const folder of rootFolders) {
          const totalSpace = folder.totalSpace || 0;
          const freeSpace = folder.freeSpace || 0;
          const usedSpace = totalSpace - freeSpace;
          const isSelected = selectedFolders.includes(folder.path);

          const enhancedFolder: FolderWithSpaceEnhanced = {
            path: folder.path,
            instanceName: instance.name,
            instanceType: 'sonarr',
            freeSpace,
            totalSpace,
            usedSpace,
            freeSpacePercent:
              totalSpace > 0 ? (freeSpace / totalSpace) * 100 : 0,
            usedSpacePercent:
              totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
            enabled: instance.enabled,
            isSelected,
            isRootFolder: true,
            isDiskSpaceFolder: false,
            driveRoot: getDriveRoot(folder.path),
            isSystemDrive: isSystemDrive(folder.path),
          };

          folderMap.set(folder.path, enhancedFolder);
        }

        // Enhance with disk space data
        for (const diskInfo of diskSpaceData) {
          const existingFolder = folderMap.get(diskInfo.path);

          if (existingFolder) {
            existingFolder.isDiskSpaceFolder = true;
            existingFolder.label = diskInfo.label;
            existingFolder.driveFormat = diskInfo.driveFormat;
            existingFolder.unmappedFolders = diskInfo.unmappedFolders;

            if (!existingFolder.totalSpace && diskInfo.totalSpace) {
              existingFolder.totalSpace = diskInfo.totalSpace;
              existingFolder.freeSpace = diskInfo.freeSpace;
              existingFolder.usedSpace =
                diskInfo.totalSpace - diskInfo.freeSpace;
              existingFolder.freeSpacePercent =
                (diskInfo.freeSpace / diskInfo.totalSpace) * 100;
              existingFolder.usedSpacePercent =
                diskInfo.percentUsed ||
                ((diskInfo.totalSpace - diskInfo.freeSpace) /
                  diskInfo.totalSpace) *
                  100;
            }
          } else {
            const isSelected = selectedFolders.includes(diskInfo.path);
            const usedSpace = diskInfo.totalSpace - diskInfo.freeSpace;

            const enhancedFolder: FolderWithSpaceEnhanced = {
              path: diskInfo.path,
              instanceName: instance.name,
              instanceType: 'sonarr',
              freeSpace: diskInfo.freeSpace,
              totalSpace: diskInfo.totalSpace,
              usedSpace,
              freeSpacePercent:
                (diskInfo.freeSpace / diskInfo.totalSpace) * 100,
              usedSpacePercent:
                diskInfo.percentUsed || (usedSpace / diskInfo.totalSpace) * 100,
              enabled: instance.enabled,
              isSelected,
              isRootFolder: false,
              isDiskSpaceFolder: true,
              label: diskInfo.label,
              driveFormat: diskInfo.driveFormat,
              unmappedFolders: diskInfo.unmappedFolders,
              driveRoot: getDriveRoot(diskInfo.path),
              isSystemDrive: isSystemDrive(diskInfo.path),
            };

            folderMap.set(diskInfo.path, enhancedFolder);
          }
        }

        allFoldersWithSpace.push(...folderMap.values());
      } catch (error) {
        console.error(
          `❌ Error fetching folders from Sonarr ${instance.name}:`,
          error
        );
      }
    }

    // Process Radarr instances (similar logic)
    for (const instance of radarrInstances) {
      try {
        const selectedFolders = instance.selectedFolders
          ? JSON.parse(instance.selectedFolders)
          : [];

        const [rootFolders, diskSpaceData] = await Promise.all([
          radarrApiClient.getRootFolders(instance),
          radarrApiClient.getDiskSpace(instance),
        ]);

        const folderMap = new Map<string, FolderWithSpaceEnhanced>();

        // Process root folders
        for (const folder of rootFolders) {
          const totalSpace = folder.totalSpace || 0;
          const freeSpace = folder.freeSpace || 0;
          const usedSpace = totalSpace - freeSpace;
          const isSelected = selectedFolders.includes(folder.path);

          const enhancedFolder: FolderWithSpaceEnhanced = {
            path: folder.path,
            instanceName: instance.name,
            instanceType: 'radarr',
            freeSpace,
            totalSpace,
            usedSpace,
            freeSpacePercent:
              totalSpace > 0 ? (freeSpace / totalSpace) * 100 : 0,
            usedSpacePercent:
              totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
            enabled: instance.enabled,
            isSelected,
            isRootFolder: true,
            isDiskSpaceFolder: false,
            driveRoot: getDriveRoot(folder.path),
            isSystemDrive: isSystemDrive(folder.path),
          };

          folderMap.set(folder.path, enhancedFolder);
        }

        // Enhance with disk space data
        for (const diskInfo of diskSpaceData) {
          const existingFolder = folderMap.get(diskInfo.path);

          if (existingFolder) {
            existingFolder.isDiskSpaceFolder = true;
            existingFolder.label = diskInfo.label;
            existingFolder.driveFormat = diskInfo.driveFormat;
            existingFolder.unmappedFolders = diskInfo.unmappedFolders;

            if (!existingFolder.totalSpace && diskInfo.totalSpace) {
              existingFolder.totalSpace = diskInfo.totalSpace;
              existingFolder.freeSpace = diskInfo.freeSpace;
              existingFolder.usedSpace =
                diskInfo.totalSpace - diskInfo.freeSpace;
              existingFolder.freeSpacePercent =
                (diskInfo.freeSpace / diskInfo.totalSpace) * 100;
              existingFolder.usedSpacePercent =
                diskInfo.percentUsed ||
                ((diskInfo.totalSpace - diskInfo.freeSpace) /
                  diskInfo.totalSpace) *
                  100;
            }
          } else {
            const isSelected = selectedFolders.includes(diskInfo.path);
            const usedSpace = diskInfo.totalSpace - diskInfo.freeSpace;

            const enhancedFolder: FolderWithSpaceEnhanced = {
              path: diskInfo.path,
              instanceName: instance.name,
              instanceType: 'radarr',
              freeSpace: diskInfo.freeSpace,
              totalSpace: diskInfo.totalSpace,
              usedSpace,
              freeSpacePercent:
                (diskInfo.freeSpace / diskInfo.totalSpace) * 100,
              usedSpacePercent:
                diskInfo.percentUsed || (usedSpace / diskInfo.totalSpace) * 100,
              enabled: instance.enabled,
              isSelected,
              isRootFolder: false,
              isDiskSpaceFolder: true,
              label: diskInfo.label,
              driveFormat: diskInfo.driveFormat,
              unmappedFolders: diskInfo.unmappedFolders,
              driveRoot: getDriveRoot(diskInfo.path),
              isSystemDrive: isSystemDrive(diskInfo.path),
            };

            folderMap.set(diskInfo.path, enhancedFolder);
          }
        }

        allFoldersWithSpace.push(...folderMap.values());
      } catch (error) {
        console.error(
          `❌ Error fetching folders from Radarr ${instance.name}:`,
          error
        );
      }
    }

    return allFoldersWithSpace;
  },
  ['all-folders-with-space'],
  {
    tags: [
      CACHE_TAGS.FOLDER_SPACE_ENHANCED,
      CACHE_TAGS.SONARR_DATA,
      CACHE_TAGS.RADARR_DATA,
    ],
    revalidate: CACHE_DURATION.FOLDER_SPACE,
  }
);

// ============================================================================
// Cache Invalidation Functions
// ============================================================================

/**
 * Invalidate media items cache (for server actions only)
 */
export async function invalidateMediaItemsCache(): Promise<void> {
  console.log('🔄 Invalidating media items cache');
  revalidateTag(CACHE_TAGS.MEDIA_ITEMS);
}

/**
 * Invalidate media items cache internally (no revalidateTag)
 */
export async function invalidateMediaItemsCacheInternal(): Promise<void> {
  console.log('🔄 Invalidating media items cache (internal)');
  // Internal cache invalidation - no revalidateTag calls
  // The UI will refresh when it detects processing completion
}

/**
 * Invalidate folder space cache (for server actions only)
 */
export async function invalidateFolderSpaceCache(): Promise<void> {
  console.log('🔄 Invalidating folder space cache');
  revalidateTag(CACHE_TAGS.FOLDER_SPACE);
  revalidateTag(CACHE_TAGS.FOLDER_SPACE_ENHANCED);
  revalidateTag(CACHE_TAGS.FOLDER_SPACE_SELECTED);
}

/**
 * Invalidate folder space cache internally (no revalidateTag)
 */
export async function invalidateFolderSpaceCacheInternal(): Promise<void> {
  console.log('🔄 Invalidating folder space cache (internal)');
  // Internal cache invalidation - no revalidateTag calls
  // The UI will refresh when it detects processing completion
}

/**
 * Invalidate API data cache (for server actions only)
 */
export async function invalidateApiDataCache(): Promise<void> {
  console.log('🔄 Invalidating API data cache');
  revalidateTag(CACHE_TAGS.SONARR_DATA);
  revalidateTag(CACHE_TAGS.RADARR_DATA);
  revalidateTag(CACHE_TAGS.EMBY_DATA);
}

/**
 * Invalidate all caches (for server actions only)
 */
export async function invalidateAllCaches(): Promise<void> {
  console.log('🔄 Invalidating all caches');
  await Promise.all([
    invalidateMediaItemsCache(),
    invalidateFolderSpaceCache(),
    invalidateApiDataCache(),
  ]);
}

/**
 * Invalidate all caches internally (no revalidateTag)
 */
export async function invalidateAllCachesInternal(): Promise<void> {
  console.log('🔄 Invalidating all caches (internal)');
  await Promise.all([
    invalidateMediaItemsCacheInternal(),
    invalidateFolderSpaceCacheInternal(),
  ]);
}

/**
 * Invalidate cache after media processing completes (internal - no revalidateTag)
 */
export async function invalidateAfterMediaProcessing(): Promise<void> {
  console.log('🔄 Invalidating caches after media processing');
  // Media processing affects both media items and folder space
  await Promise.all([
    invalidateMediaItemsCacheInternal(),
    invalidateFolderSpaceCacheInternal(),
  ]);
}

/**
 * Invalidate cache after settings changes (for server actions only)
 */
export async function invalidateAfterSettingsChange(): Promise<void> {
  console.log('🔄 Invalidating caches after settings change');
  // Settings changes can affect all data
  await invalidateAllCaches();
}
