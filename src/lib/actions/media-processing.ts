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
import {
  MediaItem,
  getEffectiveDateAdded,
  type DatePreference,
} from '@/lib/types/media';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';
import { convertMediaItemToScoringFormat } from '@/lib/utils/media-scoring';
import { getDatePreference } from './settings/app-settings';
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import type { DeletionScoreSettings } from '@/lib/actions/settings/types';
import { deletionScoreCalculator } from '@/lib/deletion-score-calculator';
import { eventsService } from '@/lib/services/events-service';

// ============================================================================
// Media Processing Functions
// ============================================================================

export async function startMediaProcessing(
  _prevState: FormState | undefined,
  _formData: FormData
): Promise<FormState<MediaProcessingResult>> {
  try {
    // Start processing in background (don't await)
    processMediaInBackground().catch(async (error) => {
      await eventsService.logError(
        'media-processor',
        `Background processing failed: ${error instanceof Error ? error.message : String(error)}`
      );
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

    await eventsService.logInfo('media-processor', 'Background media processing completed successfully');
  } catch (error) {
    await eventsService.logError(
      'media-processor',
      `Background media processing failed: ${error instanceof Error ? error.message : String(error)}`
    );
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
    await eventsService.logError(
      'media-processor',
      `Failed to get media items: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

function processMediaItem(
  item: Awaited<ReturnType<typeof getMediaItems>>[0],
  datePreference: DatePreference,
  deletionScoreSettings: DeletionScoreSettings
): MediaItem {
  const tempItem = {
    ...item,
    unwatchedDays: 0,
  } as MediaItem;

  const effectiveDateAdded = getEffectiveDateAdded(tempItem, datePreference);
  const unwatchedDays = calculateUnwatchedDays(
    item.lastWatched,
    effectiveDateAdded
  );

  const itemForScoring = convertMediaItemToScoringFormat(
    item,
    datePreference,
    null
  );

  const computedDeletionScore = deletionScoreSettings.enabled
    ? deletionScoreCalculator.calculateScore(
        itemForScoring,
        deletionScoreSettings
      )
    : item.deletionScore ?? null;

  return {
    ...item,
    effectiveDateAdded,
    unwatchedDays,
    deletionScore: computedDeletionScore,
  } as unknown as MediaItem;
}

export async function getProcessedMediaItems() {
  try {
    const [rawItems, datePreference, deletionScoreSettings] = await Promise.all([
      getMediaItems(),
      getDatePreference(),
      getDeletionScoreSettings(),
    ]);

    const processedItems = rawItems.map((item) =>
      processMediaItem(item, datePreference, deletionScoreSettings)
    );

    return processedItems;
  } catch (error) {
    await eventsService.logError(
      'media-processor',
      `Failed to get processed media items: ${error instanceof Error ? error.message : String(error)}`
    );
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
    await eventsService.logError(
      'media-processor',
      `Error getting selected folders from database: ${error instanceof Error ? error.message : String(error)}`
    );
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
    await eventsService.logError(
      'media-processor',
      `Failed to clear media items: ${error instanceof Error ? error.message : String(error)}`
    );
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
    await eventsService.logError(
      'media-processor',
      `Failed to check processing completion: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

export async function revalidateAfterProcessing(): Promise<void> {
  try {
    revalidatePath('/');
  } catch (error) {
    await eventsService.logError(
      'media-processor',
      `Failed to revalidate after processing: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
