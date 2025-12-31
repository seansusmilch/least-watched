import { sonarrApiClient } from './sonarr-service';
import { radarrApiClient } from './radarr-service';
import type { DiskSpaceInfo, RootFolderInfo } from './shared/arr-types';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';
import {
  type FolderSpaceData,
  type FolderWithSpaceEnhanced,
} from '@/lib/types/media-processing';
import { sonarrSettingsService, radarrSettingsService } from '@/lib/database';

export class FolderSpaceService {
  /**
   * Get all folders with enhanced space information (NO CACHE)
   */
  async getAllFoldersWithSpace(): Promise<FolderWithSpaceEnhanced[]> {
    console.log(
      '🔄 Fetching all folders with enhanced space information (no cache)'
    );

    try {
      const [sonarrInstances, radarrInstances] = await Promise.all([
        sonarrSettingsService.getEnabled(),
        radarrSettingsService.getEnabled(),
      ]);

      const allFoldersWithSpace: FolderWithSpaceEnhanced[] = [];

      // Helper functions
      const normalizeFolderPath = (path: string | null | undefined): string => {
        if (!path) return '';
        const trimmed = path.trim();

        const looksWindowsLike =
          /^[A-Za-z]:[\\/]/.test(trimmed) || trimmed.startsWith('\\\\');
        const looksPosixLike = trimmed.startsWith('/');

        if (looksWindowsLike) {
          let normalized = trimmed.replaceAll('/', '\\');
          while (
            normalized.length > 1 &&
            normalized.endsWith('\\') &&
            !/^[A-Za-z]:\\$/.test(normalized)
          ) {
            normalized = normalized.slice(0, -1);
          }
          return normalized.toLowerCase();
        }

        if (looksPosixLike) {
          let normalized = trimmed.replaceAll('\\', '/');
          while (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
          }
          return normalized;
        }

        let normalized = trimmed.replaceAll('\\', '/');
        while (normalized.length > 1 && normalized.endsWith('/')) {
          normalized = normalized.slice(0, -1);
        }
        return normalized.toLowerCase();
      };

      const isFolderPathSelected = (
        folderPath: string | null | undefined,
        selectedFolderSet: Set<string>,
        selectedFoldersRaw: string[]
      ): boolean => {
        const normalizedFolderPath = normalizeFolderPath(folderPath);
        if (!normalizedFolderPath) return false;
        if (selectedFolderSet.has(normalizedFolderPath)) return true;

        const folderLooksPosix = normalizedFolderPath.startsWith('/');
        for (const rawSelected of selectedFoldersRaw) {
          const normalizedSelected = normalizeFolderPath(rawSelected);
          if (!normalizedSelected) continue;

          if (normalizedFolderPath === normalizedSelected) return true;

          if (
            normalizedFolderPath.startsWith(normalizedSelected + '/') ||
            normalizedSelected.startsWith(normalizedFolderPath + '/')
          ) {
            return true;
          }

          if (folderLooksPosix && /^\/[^/]+$/.test(normalizedSelected)) {
            const selectedSegment = normalizedSelected.slice(1);
            if (!selectedSegment) continue;
            const folderSegments = normalizedFolderPath
              .split('/')
              .filter(Boolean);
            if (folderSegments.includes(selectedSegment)) {
              return true;
            }
          }
        }

        return false;
      };

      const getDriveRoot = (path: string | null | undefined): string => {
        if (!path) return '/';
        if (path.match(/^[A-Za-z]:\\/)) {
          return path.substring(0, 3);
        }
        return path.split('/')[0] || '/';
      };

      const isSystemDrive = (path: string | null | undefined): boolean => {
        if (!path) return false;
        return path.startsWith('C:\\') || path === '/';
      };

      if (process.env.NODE_ENV !== 'production') {
        console.log('📦 Folder space settings snapshot:', {
          sonarrInstances: sonarrInstances.map((i) => ({
            name: i.name,
            enabled: i.enabled,
            selectedFoldersCount: i.selectedFolders?.length ?? 0,
            selectedFoldersSample: i.selectedFolders?.slice(0, 3) ?? [],
          })),
          radarrInstances: radarrInstances.map((i) => ({
            name: i.name,
            enabled: i.enabled,
            selectedFoldersCount: i.selectedFolders?.length ?? 0,
            selectedFoldersSample: i.selectedFolders?.slice(0, 3) ?? [],
          })),
        });
      }

      // Process Sonarr instances with individual error handling
      const sonarrPromises = sonarrInstances.map(async (instance) => {
        try {
          return await this.processSonarrInstanceForEnhanced(
            instance,
            getDriveRoot,
            isSystemDrive,
            normalizeFolderPath,
            isFolderPathSelected
          );
        } catch (error) {
          console.warn(
            `⚠️ Failed to process Sonarr instance ${instance.name}:`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          return [];
        }
      });

      // Process Radarr instances with individual error handling
      const radarrPromises = radarrInstances.map(async (instance) => {
        try {
          return await this.processRadarrInstanceForEnhanced(
            instance,
            getDriveRoot,
            isSystemDrive,
            normalizeFolderPath,
            isFolderPathSelected
          );
        } catch (error) {
          console.warn(
            `⚠️ Failed to process Radarr instance ${instance.name}:`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          return [];
        }
      });

      // Wait for all instances to complete (with individual error handling)
      const [sonarrResults, radarrResults] = await Promise.all([
        Promise.all(sonarrPromises),
        Promise.all(radarrPromises),
      ]);

      // Flatten results
      sonarrResults.forEach((result) => allFoldersWithSpace.push(...result));
      radarrResults.forEach((result) => allFoldersWithSpace.push(...result));

      const isFiniteNumber = (value: unknown): value is number =>
        typeof value === 'number' && Number.isFinite(value);

      const isDisplayableFolderWithSpace = (
        folder: FolderWithSpaceEnhanced
      ): folder is FolderWithSpaceEnhanced => {
        if (!folder.path) return false;
        if (!folder.isSelected) return false;

        if (
          !isFiniteNumber(folder.totalSpace) ||
          !isFiniteNumber(folder.freeSpace) ||
          !isFiniteNumber(folder.usedSpace) ||
          !isFiniteNumber(folder.usedSpacePercent) ||
          !isFiniteNumber(folder.freeSpacePercent)
        ) {
          return false;
        }

        if (folder.totalSpace <= 0) return false;
        if (folder.freeSpace < 0 || folder.usedSpace < 0) return false;

        if (folder.usedSpacePercent < 0 || folder.usedSpacePercent > 100)
          return false;
        if (folder.freeSpacePercent < 0 || folder.freeSpacePercent > 100)
          return false;

        return true;
      };

      const displayableSelectedFolders = allFoldersWithSpace.filter(
        isDisplayableFolderWithSpace
      );

      // Group folders by path to identify shared folders
      const pathToInstances = new Map<
        string,
        { instanceName: string; instanceType: string }[]
      >();

      displayableSelectedFolders.forEach((folder) => {
        const key = normalizeFolderPath(folder.path);
        const instances = pathToInstances.get(key) || [];
        instances.push({
          instanceName: folder.instanceName,
          instanceType: folder.instanceType,
        });
        pathToInstances.set(key, instances);
      });

      // Update shared folder information
      const result = displayableSelectedFolders.map((folder) => {
        const key = normalizeFolderPath(folder.path);
        const instances = pathToInstances.get(key) || [];
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

      console.log(
        `✅ Successfully retrieved ${result.length} folders with space data`
      );

      if (process.env.NODE_ENV !== 'production') {
        const selectedCount = result.filter((f) => f.isSelected).length;
        const droppedCount = allFoldersWithSpace.length - result.length;
        console.log('🧭 Folder space selection summary:', {
          total: result.length,
          selected: selectedCount,
          droppedNotDisplayable: droppedCount,
          sample: result.slice(0, 2),
        });
      }
      return result;
    } catch (error) {
      console.error('❌ Critical error in getAllFoldersWithSpace:', error);
      return [];
    }
  }

  private async processSonarrInstanceForEnhanced(
    instance: ServiceSettings,
    getDriveRoot: (path: string | null | undefined) => string,
    isSystemDrive: (path: string | null | undefined) => boolean,
    normalizeFolderPath: (path: string | null | undefined) => string,
    isFolderPathSelected: (
      folderPath: string | null | undefined,
      selectedFolderSet: Set<string>,
      selectedFoldersRaw: string[]
    ) => boolean
  ): Promise<FolderWithSpaceEnhanced[]> {
    const selectedFolders = instance.selectedFolders || [];
    const selectedFolderSet = new Set(
      selectedFolders.map((p) => normalizeFolderPath(p)).filter(Boolean)
    );

    const [rootFolders, diskSpaceData] = await Promise.all([
      sonarrApiClient.getRootFolders(instance),
      sonarrApiClient.getDiskSpace(instance),
    ]);

    const folderMap = new Map<string, FolderWithSpaceEnhanced>();

    // Process root folders
    for (const folder of rootFolders) {
      const totalSpace = 0;
      const freeSpace = folder.freeSpace ?? 0;
      const usedSpace = totalSpace - freeSpace;
      const isSelected = isFolderPathSelected(
        folder.path ?? '',
        selectedFolderSet,
        selectedFolders
      );

      const enhancedFolder: FolderWithSpaceEnhanced = {
        path: folder.path ?? '',
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

      folderMap.set(folder.path ?? '', enhancedFolder);
    }

    // Enhance with disk space data
    for (const diskInfo of diskSpaceData) {
      const existingFolder = folderMap.get(diskInfo.path ?? '');

      if (existingFolder) {
        existingFolder.isDiskSpaceFolder = true;
        existingFolder.label = diskInfo.label ?? undefined;

        if (!existingFolder.totalSpace && diskInfo.totalSpace) {
          existingFolder.totalSpace = diskInfo.totalSpace;
          existingFolder.freeSpace = diskInfo.freeSpace ?? 0;
          existingFolder.usedSpace =
            diskInfo.totalSpace - (diskInfo.freeSpace ?? 0);
          existingFolder.freeSpacePercent =
            ((diskInfo.freeSpace ?? 0) / diskInfo.totalSpace) * 100;
          existingFolder.usedSpacePercent =
            ((diskInfo.totalSpace - (diskInfo.freeSpace ?? 0)) /
              diskInfo.totalSpace) *
            100;
        }
      } else {
        const isSelected = isFolderPathSelected(
          diskInfo.path ?? '',
          selectedFolderSet,
          selectedFolders
        );
        const usedSpace =
          (diskInfo.totalSpace ?? 0) - (diskInfo.freeSpace ?? 0);

        const enhancedFolder: FolderWithSpaceEnhanced = {
          path: diskInfo.path ?? '',
          instanceName: instance.name,
          instanceType: 'sonarr',
          freeSpace: diskInfo.freeSpace ?? 0,
          totalSpace: diskInfo.totalSpace ?? 0,
          usedSpace,
          freeSpacePercent:
            ((diskInfo.freeSpace ?? 0) / (diskInfo.totalSpace ?? 1)) * 100,
          usedSpacePercent:
            // DiskSpaceResource doesn't have percentUsed property
            (usedSpace / (diskInfo.totalSpace ?? 1)) * 100,
          enabled: instance.enabled,
          isSelected,
          isRootFolder: false,
          isDiskSpaceFolder: true,
          label: diskInfo.label ?? undefined,
          driveRoot: getDriveRoot(diskInfo.path),
          isSystemDrive: isSystemDrive(diskInfo.path),
        };

        folderMap.set(diskInfo.path ?? '', enhancedFolder);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      const computed = Array.from(folderMap.values());
      console.log('🧩 Sonarr folder space computed:', {
        instance: instance.name,
        selectedFoldersCount: selectedFolders.length,
        rootFoldersCount: rootFolders.length,
        diskSpaceCount: diskSpaceData.length,
        computedCount: computed.length,
        computedSelectedCount: computed.filter((f) => f.isSelected).length,
        selectedFoldersSample: selectedFolders.slice(0, 3),
        computedSample: computed.slice(0, 2),
      });
    }

    return Array.from(folderMap.values());
  }

  private async processRadarrInstanceForEnhanced(
    instance: ServiceSettings,
    getDriveRoot: (path: string | null | undefined) => string,
    isSystemDrive: (path: string | null | undefined) => boolean,
    normalizeFolderPath: (path: string | null | undefined) => string,
    isFolderPathSelected: (
      folderPath: string | null | undefined,
      selectedFolderSet: Set<string>,
      selectedFoldersRaw: string[]
    ) => boolean
  ): Promise<FolderWithSpaceEnhanced[]> {
    const selectedFolders = instance.selectedFolders || [];
    const selectedFolderSet = new Set(
      selectedFolders.map((p) => normalizeFolderPath(p)).filter(Boolean)
    );

    const [rootFolders, diskSpaceData] = await Promise.all([
      radarrApiClient.getRootFolders(instance),
      radarrApiClient.getDiskSpace(instance),
    ]);

    const folderMap = new Map<string, FolderWithSpaceEnhanced>();

    // Process root folders
    for (const folder of rootFolders) {
      const totalSpace = 0;
      const freeSpace = folder.freeSpace ?? 0;
      const usedSpace = totalSpace - freeSpace;
      const isSelected = isFolderPathSelected(
        folder.path ?? '',
        selectedFolderSet,
        selectedFolders
      );

      const enhancedFolder: FolderWithSpaceEnhanced = {
        path: folder.path ?? '',
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

      folderMap.set(folder.path ?? '', enhancedFolder);
    }

    // Enhance with disk space data
    for (const diskInfo of diskSpaceData) {
      const existingFolder = folderMap.get(diskInfo.path ?? '');

      if (existingFolder) {
        existingFolder.isDiskSpaceFolder = true;
        existingFolder.label = diskInfo.label ?? undefined;
        // DiskSpaceResource doesn't have driveFormat or unmappedFolders properties
        // existingFolder.driveFormat = diskInfo.driveFormat ?? undefined;
        // existingFolder.unmappedFolders = diskInfo.unmappedFolders ?? undefined;

        if (!existingFolder.totalSpace && diskInfo.totalSpace) {
          existingFolder.totalSpace = diskInfo.totalSpace;
          existingFolder.freeSpace = diskInfo.freeSpace ?? 0;
          existingFolder.usedSpace =
            diskInfo.totalSpace - (diskInfo.freeSpace ?? 0);
          existingFolder.freeSpacePercent =
            ((diskInfo.freeSpace ?? 0) / diskInfo.totalSpace) * 100;
          existingFolder.usedSpacePercent =
            // DiskSpaceResource doesn't have percentUsed property
            ((diskInfo.totalSpace - (diskInfo.freeSpace ?? 0)) /
              diskInfo.totalSpace) *
            100;
        }
      } else {
        const isSelected = isFolderPathSelected(
          diskInfo.path ?? '',
          selectedFolderSet,
          selectedFolders
        );
        const usedSpace =
          (diskInfo.totalSpace ?? 0) - (diskInfo.freeSpace ?? 0);

        const enhancedFolder: FolderWithSpaceEnhanced = {
          path: diskInfo.path ?? '',
          instanceName: instance.name,
          instanceType: 'radarr',
          freeSpace: diskInfo.freeSpace ?? 0,
          totalSpace: diskInfo.totalSpace ?? 0,
          usedSpace,
          freeSpacePercent:
            ((diskInfo.freeSpace ?? 0) / (diskInfo.totalSpace ?? 1)) * 100,
          usedSpacePercent:
            (((diskInfo.totalSpace ?? 0) - (diskInfo.freeSpace ?? 0)) /
              (diskInfo.totalSpace ?? 1)) *
            100,
          enabled: instance.enabled,
          isSelected,
          isRootFolder: false,
          isDiskSpaceFolder: true,
          label: diskInfo.label ?? undefined,
          driveRoot: getDriveRoot(diskInfo.path),
          isSystemDrive: isSystemDrive(diskInfo.path),
        };

        folderMap.set(diskInfo.path ?? '', enhancedFolder);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      const computed = Array.from(folderMap.values());
      console.log('🧩 Radarr folder space computed:', {
        instance: instance.name,
        selectedFoldersCount: selectedFolders.length,
        rootFoldersCount: rootFolders.length,
        diskSpaceCount: diskSpaceData.length,
        computedCount: computed.length,
        computedSelectedCount: computed.filter((f) => f.isSelected).length,
        selectedFoldersSample: selectedFolders.slice(0, 3),
        computedSample: computed.slice(0, 2),
      });
    }

    return Array.from(folderMap.values());
  }

  async getFolderSpaceData(): Promise<FolderSpaceData[]> {
    console.log('🔍 Fetching folder space data from Sonarr/Radarr APIs...');

    try {
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
        this.shouldIncludeFolder(folder.path || '', selectedFolders)
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
      folder.path || '',
      diskSpaceData
    );

    const folderData: FolderSpaceData = {
      path: folder.path || '',
      label: folder.path || '',
      freeSpaceGB: freeSpace / (1024 * 1024 * 1024),
      source,
      type,
    };

    if (matchingDiskSpace) {
      folderData.diskSpaceData = {
        hasEnhancedData: true,
        isSystemDrive: this.isSystemDrive(matchingDiskSpace.path),
      };

      if (matchingDiskSpace.totalSpace) {
        folderData.totalSpaceGB =
          matchingDiskSpace.totalSpace / (1024 * 1024 * 1024);
      }
    }

    return folderData;
  }

  private findMatchingDiskSpace(
    folderPath: string,
    diskSpaceData: DiskSpaceInfo[]
  ): DiskSpaceInfo | undefined {
    return diskSpaceData.find(
      (ds) =>
        ds.path === folderPath || (ds.path && folderPath.startsWith(ds.path))
    );
  }

  private isSystemDrive(path: string | null | undefined): boolean {
    if (!path) return false;
    return path === 'C:\\' || path === '/';
  }
}

export const folderSpaceService = new FolderSpaceService();
