import { folderSpaceService } from '../services/folder-space-service';
import { sonarrApiClient, radarrApiClient } from '../services/api-client';
import {
  type FolderSpaceData,
  type FolderWithSpaceEnhanced,
} from '../types/media-processing';

// ============================================================================
// Folder Space - Direct API Calls (No Caching)
// ============================================================================

/**
 * Get folder space data (NO CACHE)
 */
export const getFolderSpaceData = async (): Promise<FolderSpaceData[]> => {
  console.log('🔄 Fetching folder space data from APIs (no cache)');
  return await folderSpaceService.getFolderSpaceData();
};

/**
 * Get all folders with enhanced space information (NO CACHE)
 */
export const getAllFoldersWithSpace = async (): Promise<
  FolderWithSpaceEnhanced[]
> => {
  console.log(
    '🔄 Fetching all folders with enhanced space information (no cache)'
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
      const selectedFolders = instance.selectedFolders || [];

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
          freeSpacePercent: totalSpace > 0 ? (freeSpace / totalSpace) * 100 : 0,
          usedSpacePercent: totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
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
            existingFolder.usedSpace = diskInfo.totalSpace - diskInfo.freeSpace;
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
            freeSpacePercent: (diskInfo.freeSpace / diskInfo.totalSpace) * 100,
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
      const selectedFolders = instance.selectedFolders || [];

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
          freeSpacePercent: totalSpace > 0 ? (freeSpace / totalSpace) * 100 : 0,
          usedSpacePercent: totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
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
            existingFolder.usedSpace = diskInfo.totalSpace - diskInfo.freeSpace;
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
            freeSpacePercent: (diskInfo.freeSpace / diskInfo.totalSpace) * 100,
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

  // Group folders by path to identify shared folders
  const pathToInstances = new Map<
    string,
    { instanceName: string; instanceType: string }[]
  >();

  allFoldersWithSpace.forEach((folder) => {
    const instances = pathToInstances.get(folder.path) || [];
    instances.push({
      instanceName: folder.instanceName,
      instanceType: folder.instanceType,
    });
    pathToInstances.set(folder.path, instances);
  });

  // Update shared folder information
  return allFoldersWithSpace.map((folder) => {
    const instances = pathToInstances.get(folder.path) || [];
    const instanceCount = instances.length;
    const isShared = instanceCount > 1;

    return {
      ...folder,
      isShared,
      instanceCount,
      sharedInstances: isShared
        ? instances.map((i) => `${i.instanceName} (${i.instanceType})`)
        : undefined,
    };
  });
};
