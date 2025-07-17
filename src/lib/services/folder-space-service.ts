import {
  sonarrApiClient,
  radarrApiClient,
  type DiskSpaceInfo,
  type RootFolderInfo,
} from './api-client';
import type { ServiceSettings } from '../utils/prefixed-settings';
import {
  type FolderSpaceData,
  type FolderWithSpaceEnhanced,
} from '../types/media-processing';

export class FolderSpaceService {
  /**
   * Get all folders with enhanced space information (NO CACHE)
   */
  async getAllFoldersWithSpace(): Promise<FolderWithSpaceEnhanced[]> {
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
  }
  async getFolderSpaceData(): Promise<FolderSpaceData[]> {
    console.log('🔍 Fetching folder space data from Sonarr/Radarr APIs...');

    try {
      const { sonarrSettingsService, radarrSettingsService } = await import(
        '../database'
      );

      const [sonarrInstances, radarrInstances] = await Promise.all([
        sonarrSettingsService.getEnabled(),
        radarrSettingsService.getEnabled(),
      ]);

      const folderSpaceData: FolderSpaceData[] = [];

      // Process all instances in parallel
      const [sonarrData, radarrData] = await Promise.all([
        this.processSonarrInstances(sonarrInstances),
        this.processRadarrInstances(radarrInstances),
      ]);

      folderSpaceData.push(...sonarrData, ...radarrData);

      console.log(
        `✅ Retrieved ${folderSpaceData.length} folder space entries`
      );
      return folderSpaceData;
    } catch (error) {
      console.error('❌ Error fetching folder space data:', error);
      return [];
    }
  }

  private async processSonarrInstances(
    instances: ServiceSettings[]
  ): Promise<FolderSpaceData[]> {
    const results: FolderSpaceData[] = [];

    for (const instance of instances) {
      try {
        console.log(`📡 Fetching disk space from Sonarr: ${instance.name}`);

        const [rootFolders, diskSpaceData] = await Promise.all([
          sonarrApiClient.getRootFolders(instance),
          sonarrApiClient.getDiskSpace(instance),
        ]);

        console.log(
          `📊 Received ${rootFolders.length} root folder entries from Sonarr ${instance.name}`
        );
        console.log(
          `💾 Received ${diskSpaceData.length} disk space entries from Sonarr ${instance.name}`
        );

        // ServiceSettings has selectedFolders as string[] | undefined
        const selectedFolders = instance.selectedFolders || [];
        const folderData = this.createFolderSpaceData(
          rootFolders,
          diskSpaceData,
          selectedFolders,
          `Sonarr: ${instance.name}`,
          'tv'
        );

        results.push(...folderData);
      } catch (error) {
        console.error(
          `❌ Error fetching disk space from Sonarr ${instance.name}:`,
          error
        );
      }
    }

    return results;
  }

  private async processRadarrInstances(
    instances: ServiceSettings[]
  ): Promise<FolderSpaceData[]> {
    const results: FolderSpaceData[] = [];

    for (const instance of instances) {
      try {
        console.log(`📡 Fetching disk space from Radarr: ${instance.name}`);

        const [rootFolders, diskSpaceData] = await Promise.all([
          radarrApiClient.getRootFolders(instance),
          radarrApiClient.getDiskSpace(instance),
        ]);

        console.log(
          `📊 Received ${rootFolders.length} root folder entries from Radarr ${instance.name}`
        );
        console.log(
          `💾 Received ${diskSpaceData.length} disk space entries from Radarr ${instance.name}`
        );

        // ServiceSettings has selectedFolders as string[] | undefined
        const selectedFolders = instance.selectedFolders || [];
        const folderData = this.createFolderSpaceData(
          rootFolders,
          diskSpaceData,
          selectedFolders,
          `Radarr: ${instance.name}`,
          'movie'
        );

        results.push(...folderData);
      } catch (error) {
        console.error(
          `❌ Error fetching disk space from Radarr ${instance.name}:`,
          error
        );
      }
    }

    return results;
  }

  private createFolderSpaceData(
    rootFolders: RootFolderInfo[],
    diskSpaceData: DiskSpaceInfo[],
    selectedFolders: string[],
    source: string,
    type: 'tv' | 'movie'
  ): FolderSpaceData[] {
    return rootFolders
      .filter((folder) =>
        this.shouldIncludeFolder(folder.path, selectedFolders)
      )
      .map((folder) =>
        this.transformToFolderSpaceData(folder, diskSpaceData, source, type)
      );
  }

  private shouldIncludeFolder(
    folderPath: string,
    selectedFolders: string[]
  ): boolean {
    return selectedFolders.length === 0 || selectedFolders.includes(folderPath);
  }

  private transformToFolderSpaceData(
    folder: RootFolderInfo,
    diskSpaceData: DiskSpaceInfo[],
    source: string,
    type: 'tv' | 'movie'
  ): FolderSpaceData {
    const freeSpace = folder.freeSpace || 0;
    const matchingDiskSpace = this.findMatchingDiskSpace(
      folder.path,
      diskSpaceData
    );

    const folderData: FolderSpaceData = {
      path: folder.path,
      label: folder.path,
      freeSpaceGB: freeSpace / (1024 * 1024 * 1024),
      source,
      type,
    };

    if (matchingDiskSpace) {
      folderData.diskSpaceData = {
        percentUsed: matchingDiskSpace.percentUsed,
        driveFormat: matchingDiskSpace.driveFormat,
        unmappedFolders: matchingDiskSpace.unmappedFolders,
        hasEnhancedData: true,
        isSystemDrive: this.isSystemDrive(matchingDiskSpace.path),
      };

      if (matchingDiskSpace.totalSpace) {
        folderData.totalSpaceGB =
          matchingDiskSpace.totalSpace / (1024 * 1024 * 1024);
      }
    }

    // Add total space from root folder if available
    if (folder.totalSpace) {
      folderData.totalSpaceGB = folder.totalSpace / (1024 * 1024 * 1024);
    }

    return folderData;
  }

  private findMatchingDiskSpace(
    folderPath: string,
    diskSpaceData: DiskSpaceInfo[]
  ): DiskSpaceInfo | undefined {
    return diskSpaceData.find(
      (ds) => ds.path === folderPath || folderPath.startsWith(ds.path)
    );
  }

  private isSystemDrive(path: string): boolean {
    return path === 'C:\\' || path === '/';
  }
}

export const folderSpaceService = new FolderSpaceService();
