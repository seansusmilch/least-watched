import { type MediaProcessingProgress } from './types';

// Simple in-memory progress store for now
class ProgressStoreImpl {
  private progress: MediaProcessingProgress | null = null;

  async setProgress(progress: MediaProcessingProgress): Promise<void> {
    this.progress = progress;
  }

  async getProgress(): Promise<MediaProcessingProgress | null> {
    return this.progress;
  }

  async clearProgress(): Promise<void> {
    this.progress = null;
  }

  async getActiveProcess(): Promise<MediaProcessingProgress | null> {
    return this.progress && !this.progress.isComplete ? this.progress : null;
  }
}

export const ProgressStore = new ProgressStoreImpl();
