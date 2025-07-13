import { type MediaProcessingProgress } from './types/media-processing';

// Global progress tracking
const progressStore = new Map<string, MediaProcessingProgress>();

export class ProgressStore {
  static setProgress(
    progressId: string,
    progress: MediaProcessingProgress
  ): void {
    progressStore.set(progressId, progress);
  }

  static getProgress(progressId: string): MediaProcessingProgress | null {
    return progressStore.get(progressId) || null;
  }

  static clearProgress(progressId: string): void {
    progressStore.delete(progressId);
  }

  static getActiveProcess(): {
    progressId: string;
    progress: MediaProcessingProgress;
  } | null {
    for (const [progressId, progress] of Array.from(progressStore.entries())) {
      if (!progress.isComplete && !progress.error) {
        return { progressId, progress };
      }
    }
    return null;
  }

  static getAllProgress(): Map<string, MediaProcessingProgress> {
    return new Map(progressStore);
  }
}
