'use server';
import { ProgressStore } from '../media-processor/progress-store';
import { type MediaProcessingProgress } from '../media-processor/types';

export type ProgressState = 'none' | 'live' | 'completed';

export interface ProgressData {
  state: ProgressState;
  progress?: MediaProcessingProgress;
}

export async function getProgress(): Promise<ProgressData> {
  try {
    const progress = await ProgressStore.getProgress();
    console.log('fetching progress', progress);

    if (!progress) {
      return { state: 'none' };
    }

    if (progress.isComplete) {
      return { state: 'completed', progress };
    }

    return { state: 'live', progress };
  } catch (error) {
    console.error('Failed to get progress:', error);
    return { state: 'none' };
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await ProgressStore.clearProgress();
  } catch (error) {
    console.error('Failed to clear progress:', error);
  }
}
