'use server';

import { MediaProcessor } from '../media-processor';
import { randomUUID } from 'crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  getCachedMediaItems,
  getCachedMediaItemsWithScores,
  getCachedFolderSpaceData,
  getCachedSelectedFoldersWithSpace,
  getCachedAllFoldersWithSpace,
  invalidateAfterMediaProcessing,
  invalidateAfterSettingsChange,
} from '../cache/data-cache';
import {
  type MediaProcessingProgress,
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
    revalidateTag('media-processing');

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

    // Invalidate internal caches
    await invalidateAfterMediaProcessing();

    console.log('✅ Background media processing completed successfully');
  } catch (error) {
    console.error('Background media processing failed:', error);
    throw error;
  }
}

export async function getProcessingProgress(
  progressId: string
): Promise<MediaProcessingProgress | null> {
  try {
    if (!progressId) {
      throw new Error('Progress ID is required');
    }

    const { ProgressStore } = await import('../progress-store');
    return ProgressStore.getProgress(progressId);
  } catch (error) {
    console.error('Failed to get processing progress:', error);
    return null;
  }
}

export async function getActiveMediaProcess(): Promise<{
  progressId: string;
  progress: MediaProcessingProgress;
} | null> {
  try {
    const { ProgressStore } = await import('../progress-store');
    return ProgressStore.getActiveProcess();
  } catch (error) {
    console.error('Failed to get active media process:', error);
    return null;
  }
}

export async function cancelMediaProcessing(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const progressId = formData.get('progressId') as string;

    if (!progressId) {
      return createFormState(false, 'Progress ID is required');
    }

    // TODO: Implement actual cancellation logic in MediaProcessor
    // For now, just return success

    revalidatePath('/');
    revalidateTag('media-processing');

    return createFormState(true, 'Media processing cancelled successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to cancel media processing');
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

export async function getMediaItemsWithScores(): Promise<
  CachedMediaItemData[]
> {
  try {
    return await getCachedMediaItemsWithScores();
  } catch (error) {
    console.error('Failed to get media items with scores:', error);
    return [];
  }
}

export async function refreshMediaItems(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState> {
  try {
    // Invalidate media items cache
    await invalidateAfterMediaProcessing();

    // Revalidate paths and tags
    revalidatePath('/');
    revalidateTag('media-items');

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
    // Invalidate folder space cache
    await invalidateAfterSettingsChange();

    // Revalidate paths and tags
    revalidatePath('/');
    revalidateTag('folder-space');

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
    await invalidateAfterSettingsChange();

    revalidatePath('/');
    revalidatePath('/settings');
    revalidateTag('settings');
    revalidateTag('folder-space');

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
    await invalidateAfterMediaProcessing();

    revalidatePath('/');
    revalidateTag('media-items');
    revalidateTag('folder-space');
    revalidateTag('media-processing');

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
    const allItems = await getMediaItemsWithScores();
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

export async function checkProcessingComplete(
  progressId: string
): Promise<boolean> {
  try {
    const progress = await getProcessingProgress(progressId);

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
    revalidateTag('media-items');
    revalidateTag('folder-space');
    revalidateTag('media-processing');
  } catch (error) {
    console.error('Failed to revalidate after processing:', error);
  }
}
