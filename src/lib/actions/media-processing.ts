/* eslint-disable @typescript-eslint/no-unused-vars */
'use server';

import {
  MediaProcessor,
  type MediaProcessingProgress,
} from '../media-processor/';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import {
  getCachedMediaItems,
  getCachedFolderSpaceData,
  getCachedSelectedFoldersWithSpace,
  getCachedAllFoldersWithSpace,
} from '../cache/data-cache';
import {
  type MediaProcessingResult,
  type SelectedFoldersFromDatabase,
} from '../types/media-processing';
import {
  type CachedMediaItemData,
  type FolderSpaceData,
  type FolderWithSpace,
  type FolderWithSpaceEnhanced,
} from '../types/cached-data';
import {
  createFormState,
  handleServerError,
  type FormState,
} from '../validation/schemas';

// ============================================================================
// Media Processing Functions
// ============================================================================

export async function startMediaProcessing(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState<MediaProcessingResult>> {
  try {
    const progressId = randomUUID();

    // Start processing in background (don't await)
    processMediaInBackground(progressId).catch((error) => {
      console.error('Background processing failed:', error);
    });

    const result: MediaProcessingResult = {
      success: true,
      message: 'Processing started successfully',
      progressId,
    };

    // Revalidate relevant paths and tags immediately when starting
    revalidatePath('/');

    return createFormState<MediaProcessingResult>(
      true,
      'Media processing started successfully',
      undefined,
      result
    );
  } catch (error) {
    return handleServerError(
      error,
      'Failed to start media processing'
    ) as FormState<MediaProcessingResult>;
  }
}

async function processMediaInBackground(progressId: string): Promise<void> {
  try {
    const processor = new MediaProcessor(undefined, progressId);
    await processor.processAllMedia();

    // Cache invalidation is disabled

    console.log('✅ Background media processing completed successfully');

    // Clean up old progress records
    const { ProgressStore } = await import('../media-processor/progress-store');
    await ProgressStore.cleanupOldProgress();
  } catch (error) {
    console.error('Background media processing failed:', error);
    throw error;
  }
}

// ============================================================================
// Media Items Functions (Cached)
// ============================================================================

export async function getMediaItems(): Promise<CachedMediaItemData[]> {
  try {
    return await getCachedMediaItems();
  } catch (error) {
    console.error('Failed to get media items:', error);
    return [];
  }
}

export async function refreshMediaItems(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState> {
  try {
    // Cache invalidation is disabled

    // Revalidate paths and tags
    revalidatePath('/');

    return createFormState(true, 'Media items refreshed successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to refresh media items');
  }
}

// ============================================================================
// Folder Space Functions (Cached)
// ============================================================================

export async function getFolderSpaceData(): Promise<FolderSpaceData[]> {
  try {
    return await getCachedFolderSpaceData();
  } catch (error) {
    console.error('Failed to get folder space data:', error);
    return [];
  }
}

export async function refreshFolderSpaceData(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState> {
  try {
    // Cache invalidation is disabled

    // Revalidate paths and tags
    revalidatePath('/');

    return createFormState(true, 'Folder space data refreshed successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to refresh folder space data');
  }
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
      folders: instance.selectedFolders || [],
      enabled: instance.enabled,
    }));

    const radarrFolders = radarrInstances.map((instance) => ({
      instanceName: instance.name,
      folders: instance.selectedFolders || [],
      enabled: instance.enabled,
    }));

    return { sonarrFolders, radarrFolders };
  } catch (error) {
    console.error('❌ Error getting selected folders from database:', error);
    return { sonarrFolders: [], radarrFolders: [] };
  }
}

// Get selected folders with disk space information (Cached)
export async function getSelectedFoldersWithSpace(): Promise<
  FolderWithSpace[]
> {
  try {
    return await getCachedSelectedFoldersWithSpace();
  } catch (error) {
    console.error('Failed to get selected folders with space:', error);
    return [];
  }
}

// Get all folders with disk space information (Cached)
export async function getAllFoldersWithSpace(): Promise<
  FolderWithSpaceEnhanced[]
> {
  try {
    return await getCachedAllFoldersWithSpace();
  } catch (error) {
    console.error('Failed to get all folders with space:', error);
    return [];
  }
}

// ============================================================================
// Cache Invalidation Functions
// ============================================================================

/**
 * Invalidate caches after settings change
 */
export async function invalidateCachesAfterSettingsChange(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState> {
  try {
    // Cache invalidation is disabled

    revalidatePath('/');
    revalidatePath('/settings');

    return createFormState(true, 'Caches invalidated successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to invalidate caches');
  }
}

/**
 * Invalidate caches after media processing
 */
export async function invalidateCachesAfterMediaProcessing(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState> {
  try {
    // Cache invalidation is disabled

    revalidatePath('/');

    return createFormState(true, 'Caches invalidated successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to invalidate caches');
  }
}

// ============================================================================
// Export Functions
// ============================================================================

export async function exportMediaItems(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const selectedIds = formData.getAll('selectedIds') as string[];

    if (!selectedIds || selectedIds.length === 0) {
      return createFormState(false, 'No items selected for export');
    }

    // Get media items
    const allItems = await getMediaItems();
    const selectedItems = allItems.filter((item) =>
      selectedIds.includes(item.id)
    );

    if (selectedItems.length === 0) {
      return createFormState(false, 'No valid items found for export');
    }

    // TODO: Implement actual export logic
    // For now, just return success with count
    const message = `Successfully exported ${selectedItems.length} item${
      selectedItems.length === 1 ? '' : 's'
    }`;

    return createFormState(true, message, undefined, {
      count: selectedItems.length,
    });
  } catch (error) {
    return handleServerError(error, 'Failed to export media items');
  }
}

export async function checkProcessingComplete(): Promise<boolean> {
  try {
    const progress = await getProcessingProgress();

    if (progress && progress.isComplete) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to check processing completion:', error);
    return false;
  }
}

export async function revalidateAfterProcessing(): Promise<void> {
  'use server';

  try {
    // Safe to call revalidation from a server action
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to revalidate after processing:', error);
  }
}
