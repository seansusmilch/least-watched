/* eslint-disable @typescript-eslint/no-unused-vars */
'use server';

import { MediaProcessor } from '@/lib/media-processor/';
import { revalidatePath } from 'next/cache';
import {
  type MediaProcessingResult,
  type SelectedFoldersFromDatabase,
} from '@/lib/types/media-processing';

import {
  createFormState,
  handleServerError,
  type FormState,
} from '@/lib/validation/schemas';
import {
  prisma,
  sonarrSettingsService,
  radarrSettingsService,
} from '@/lib/database';
import { getProgress } from './progress';
import { ProgressStore } from '@/lib/media-processor/progress-store';
import { MediaItem, getEffectiveDateAdded } from '@/lib/types/media';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';
import { getDatePreference } from './settings/app-settings';
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import {
  deletionScoreCalculator,
  type MediaItemForScoring,
} from '@/lib/deletion-score-calculator';

// ============================================================================
// Media Processing Functions
// ============================================================================

export async function startMediaProcessing(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState<MediaProcessingResult>> {
  try {
    // Start processing in background (don't await)
    processMediaInBackground().catch((error) => {
      console.error('Background processing failed:', error);
    });

    const result: MediaProcessingResult = {
      success: true,
      message: 'Processing started successfully',
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

async function processMediaInBackground(): Promise<void> {
  try {
    await ProgressStore.clearProgress();

    const processor = new MediaProcessor(undefined);
    await processor.processAllMedia();

    console.log('✅ Background media processing completed successfully');
  } catch (error) {
    console.error('Background media processing failed:', error);
    throw error;
  }
}

export async function getMediaItems() {
  try {
    const mediaItems = await prisma.mediaItem.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return mediaItems;
  } catch (error) {
    console.error('Failed to get media items:', error);
    return [];
  }
}

export async function getProcessedMediaItems() {
  try {
    const [rawItems, datePreference, deletionScoreSettings] = await Promise.all(
      [getMediaItems(), getDatePreference(), getDeletionScoreSettings()]
    );

    const processedItems = rawItems.map((item) => {
      // Create a temporary object with required properties for getEffectiveDateAdded
      const tempItem = {
        ...item,
        unwatchedDays: 0, // Temporary value
      } as MediaItem;

      const effectiveDateAdded = getEffectiveDateAdded(
        tempItem,
        datePreference
      );

      const unwatchedDays = calculateUnwatchedDays(
        item.lastWatched,
        effectiveDateAdded
      );

      const itemForScoring: MediaItemForScoring = {
        id: item.id,
        sizeOnDisk:
          item.sizeOnDisk === null || item.sizeOnDisk === undefined
            ? null
            : typeof item.sizeOnDisk === 'bigint'
            ? item.sizeOnDisk
            : BigInt(item.sizeOnDisk),
        dateAddedEmby: item.dateAddedEmby ? new Date(item.dateAddedEmby) : null,
        dateAddedArr: item.dateAddedArr ? new Date(item.dateAddedArr) : null,
        datePreference,
        lastWatched: item.lastWatched ? new Date(item.lastWatched) : null,
        folderRemainingSpacePercent: null,
      };

      const computedDeletionScore = deletionScoreSettings.enabled
        ? deletionScoreCalculator.calculateScore(
            itemForScoring,
            deletionScoreSettings
          )
        : item.deletionScore;

      return {
        ...item,
        effectiveDateAdded,
        unwatchedDays,
        deletionScore: computedDeletionScore,
      } as MediaItem;
    });

    return processedItems;
  } catch (error) {
    console.error('Failed to get processed media items:', error);
    return [];
  }
}

export async function refreshMediaItems(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState> {
  try {
    revalidatePath('/');

    return createFormState(true, 'Media items refreshed successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to refresh media items');
  }
}

export async function refreshFolderSpaceData(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState> {
  try {
    revalidatePath('/');

    return createFormState(true, 'Folder space data refreshed successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to refresh folder space data');
  }
}

export async function getSelectedFoldersFromDatabase(): Promise<SelectedFoldersFromDatabase> {
  try {
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

export async function clearMediaItems(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const itemCount = await prisma.mediaItem.count();

    await prisma.mediaItem.deleteMany();

    // Revalidate paths
    revalidatePath('/');

    const message = `Successfully cleared ${itemCount} media item${
      itemCount === 1 ? '' : 's'
    } from the database`;

    return {
      success: true,
      message,
    };
  } catch (error) {
    console.error('Failed to clear media items:', error);
    return {
      success: false,
      error: 'Failed to clear media items from the database',
    };
  }
}

export async function checkProcessingComplete(): Promise<boolean> {
  try {
    const progress = await getProgress();

    if (progress && progress.state === 'completed') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to check processing completion:', error);
    return false;
  }
}

export async function revalidateAfterProcessing(): Promise<void> {
  try {
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to revalidate after processing:', error);
  }
}
