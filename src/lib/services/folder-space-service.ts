import {
  sonarrApiClient,
  radarrApiClient,
  type DiskSpaceInfo,
  type RootFolderInfo,
} from './api-client';
import type { ServiceSettings } from '../utils/prefixed-settings';
import { type FolderSpaceData } from '../types/media-processing';

export class FolderSpaceService {
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
