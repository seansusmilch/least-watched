'use server';

import { MediaProcessor } from '../media-processor';
import { randomUUID } from 'crypto';
import { mediaService } from '../services/media-service';
import { folderSpaceService } from '../services/folder-space-service';
import { sonarrApiClient, radarrApiClient } from '../services/api-client';
import {
  type MediaProcessingProgress,
  type MediaProcessingResult,
  type MediaItemData,
  type FolderSpaceData,
  type SelectedFoldersFromDatabase,
  type FolderWithSpace,
  type FolderWithSpaceEnhanced,
} from '../types/media-processing';

// ============================================================================
// Media Processing Functions
// ============================================================================

export async function startMediaProcessing(): Promise<MediaProcessingResult> {
  const progressId = randomUUID();

  // Start processing in background (don't await)
  processMediaInBackground(progressId).catch((error) => {
    console.error('Background processing failed:', error);
  });

  return {
    success: true,
    message: 'Processing started',
    progressId,
  };
}

async function processMediaInBackground(progressId: string): Promise<void> {
  const processor = new MediaProcessor(undefined, progressId);
  await processor.processAllMedia();
}

// Keep the original function for backward compatibility but mark it as deprecated
export async function processMediaLibrary(): Promise<MediaProcessingResult> {
  return startMediaProcessing();
}

export async function getProcessingProgress(
  progressId: string
): Promise<MediaProcessingProgress | null> {
  return MediaProcessor.getProgress(progressId);
}

// ============================================================================
// Media Items Functions
// ============================================================================

export async function getMediaItems(): Promise<MediaItemData[]> {
  return mediaService.getMediaItems();
}

export async function getMediaItemsWithScores(): Promise<MediaItemData[]> {
  return mediaService.getMediaItemsWithScores();
}

// ============================================================================
// Folder Space Functions
// ============================================================================

export async function getFolderSpaceData(): Promise<FolderSpaceData[]> {
  return folderSpaceService.getFolderSpaceData();
}

// Get selected folders directly from database
export async function getSelectedFoldersFromDatabase(): Promise<SelectedFoldersFromDatabase> {
  try {
    const { sonarrSettingsService, radarrSettingsService } = await import(
      '../database'
    );

    const [sonarrInstances, radarrInstances] = await Promise.all([
      sonarrSettingsService.getEnabled(),
      radarrSettingsService.getEnabled(),
    ]);

    const sonarrFolders = sonarrInstances.map((instance) => ({
      instanceName: instance.name,
      folders: instance.selectedFolders
        ? JSON.parse(instance.selectedFolders)
        : [],
      enabled: instance.enabled,
    }));

    const radarrFolders = radarrInstances.map((instance) => ({
      instanceName: instance.name,
      folders: instance.selectedFolders
        ? JSON.parse(instance.selectedFolders)
        : [],
      enabled: instance.enabled,
    }));

    return { sonarrFolders, radarrFolders };
  } catch (error) {
    console.error('❌ Error getting selected folders from database:', error);
    return { sonarrFolders: [], radarrFolders: [] };
  }
}

// Get selected folders with disk space information
export async function getSelectedFoldersWithSpace(): Promise<
  FolderWithSpace[]
> {
  try {
    console.log('🔍 Fetching selected folders with disk space information...');

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

        if (selectedFolders.length === 0) {
          console.log(`📂 No folders selected for Sonarr: ${instance.name}`);
          continue;
        }

        console.log(`📡 Fetching disk space from Sonarr: ${instance.name}`);

        const rootFolders = await sonarrApiClient.getRootFolders(instance);

        // Filter to only include selected folders
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

        console.log(
          `✅ Added ${matchingFolders.length} folders from Sonarr: ${instance.name}`
        );
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

        if (selectedFolders.length === 0) {
          console.log(`📂 No folders selected for Radarr: ${instance.name}`);
          continue;
        }

        console.log(`📡 Fetching disk space from Radarr: ${instance.name}`);

        const rootFolders = await radarrApiClient.getRootFolders(instance);

        // Filter to only include selected folders
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

        console.log(
          `✅ Added ${matchingFolders.length} folders from Radarr: ${instance.name}`
        );
      } catch (error) {
        console.error(
          `❌ Error fetching disk space from Radarr ${instance.name}:`,
          error
        );
      }
    }

    console.log(
      `🎉 Successfully fetched ${foldersWithSpace.length} folders with disk space information`
    );
    return foldersWithSpace;
  } catch (error) {
    console.error('❌ Error getting selected folders with disk space:', error);
    return [];
  }
}

// Get all folders with disk space information (both selected and available)
export async function getAllFoldersWithSpace(): Promise<
  FolderWithSpaceEnhanced[]
> {
  try {
    console.log('🔍 Fetching ALL folders with disk space information...');

    const { sonarrSettingsService, radarrSettingsService } = await import(
      '../database'
    );

    const [sonarrInstances, radarrInstances] = await Promise.all([
      sonarrSettingsService.getEnabled(),
      radarrSettingsService.getEnabled(),
    ]);

    const allFoldersWithSpace: FolderWithSpaceEnhanced[] = [];

    // Process Sonarr instances
    for (const instance of sonarrInstances) {
      try {
        const selectedFolders = instance.selectedFolders
          ? JSON.parse(instance.selectedFolders)
          : [];

        console.log(`📡 Fetching ALL folders from Sonarr: ${instance.name}`);

        const [rootFolders, diskSpaceData] = await Promise.all([
          sonarrApiClient.getRootFolders(instance),
          sonarrApiClient.getDiskSpace(instance),
        ]);

        console.log(
          `📊 Received ${rootFolders.length} root folders and ${diskSpaceData.length} disk space entries from Sonarr ${instance.name}`
        );

        // Create a map of all folders we've seen
        const folderMap = new Map<string, FolderWithSpaceEnhanced>();

        // Process root folders first
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
            // Enhance existing folder with disk space info
            existingFolder.isDiskSpaceFolder = true;
            existingFolder.label = diskInfo.label;
            existingFolder.driveFormat = diskInfo.driveFormat;
            existingFolder.unmappedFolders = diskInfo.unmappedFolders;

            // Use disk space data if root folder data is missing
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
            // Create new folder from disk space data
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
        console.log(
          `✅ Added ${folderMap.size} folders from Sonarr: ${instance.name}`
        );
      } catch (error) {
        console.error(
          `❌ Error fetching folders from Sonarr ${instance.name}:`,
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

        console.log(`📡 Fetching ALL folders from Radarr: ${instance.name}`);

        const [rootFolders, diskSpaceData] = await Promise.all([
          radarrApiClient.getRootFolders(instance),
          radarrApiClient.getDiskSpace(instance),
        ]);

        console.log(
          `📊 Received ${rootFolders.length} root folders and ${diskSpaceData.length} disk space entries from Radarr ${instance.name}`
        );

        // Create a map of all folders we've seen
        const folderMap = new Map<string, FolderWithSpaceEnhanced>();

        // Process root folders first
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
            // Enhance existing folder with disk space info
            existingFolder.isDiskSpaceFolder = true;
            existingFolder.label = diskInfo.label;
            existingFolder.driveFormat = diskInfo.driveFormat;
            existingFolder.unmappedFolders = diskInfo.unmappedFolders;

            // Use disk space data if root folder data is missing
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
            // Create new folder from disk space data
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
        console.log(
          `✅ Added ${folderMap.size} folders from Radarr: ${instance.name}`
        );
      } catch (error) {
        console.error(
          `❌ Error fetching folders from Radarr ${instance.name}:`,
          error
        );
      }
    }

    console.log(
      `🎉 Successfully fetched ${allFoldersWithSpace.length} folders with disk space information`
    );
    return allFoldersWithSpace;
  } catch (error) {
    console.error('❌ Error getting all folders with disk space:', error);
    return [];
  }
}

// Helper functions for folder path processing
function getDriveRoot(path: string): string {
  if (path.match(/^[A-Za-z]:\\/)) {
    // Windows path
    return path.substring(0, 3); // "C:\"
  } else if (path.startsWith('/')) {
    // Unix path
    return '/';
  }
  return path;
}

function isSystemDrive(path: string): boolean {
  return path.startsWith('C:\\') || path === '/';
}

// ============================================================================
// Enhanced Media Processing Functions
// ============================================================================

// ============================================================================
// Re-export types for backward compatibility
// ============================================================================

export type {
  MediaProcessingProgress,
  MediaProcessingResult,
  MediaItemData,
  FolderSpaceData,
  SelectedFoldersFromDatabase,
  FolderWithSpace,
  FolderWithSpaceEnhanced,
} from '../types/media-processing';
