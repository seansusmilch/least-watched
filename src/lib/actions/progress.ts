'use server';
import { ProgressStore } from '../media-processor/progress-store';
import { type MediaProcessingProgress } from '../media-processor/types';
import { eventsService } from '../services/events-service';

export type ProgressState = 'none' | 'live' | 'completed';

export interface ProgressData {
  state: ProgressState;
  progress?: MediaProcessingProgress;
}

export async function getProgress(): Promise<ProgressData> {
  try {
    const progress = await ProgressStore.getProgress();

    if (!progress) {
      return { state: 'none' };
    }

    if (progress.isComplete) {
      return { state: 'completed', progress };
    }

    return { state: 'live', progress };
  } catch (error) {
    await eventsService.logError(
      'system',
      `Failed to get progress: ${error instanceof Error ? error.message : String(error)}`
    );
    return { state: 'none' };
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await ProgressStore.clearProgress();
  } catch (error) {
    await eventsService.logError(
      'system',
      `Failed to clear progress: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
