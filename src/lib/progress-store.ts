import { type MediaProcessingProgress } from './media-processor/';

interface ProgressRecord {
  progress: MediaProcessingProgress;
  createdAt: Date;
  updatedAt: Date;
}

export class ProgressStore {
  private static currentProgress: ProgressRecord | null = null;

  static async setProgress(progress: MediaProcessingProgress): Promise<void> {
    try {
      const now = new Date();

      this.currentProgress = {
        progress: {
          ...progress,
          isComplete: progress.isComplete || false,
        },
        createdAt: this.currentProgress?.createdAt || now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Failed to set progress:', error);
    }
  }

  static async getProgress(): Promise<MediaProcessingProgress | null> {
    try {
      if (!this.currentProgress) {
        return null;
      }

      return {
        ...this.currentProgress.progress,
        error: this.currentProgress.progress.error || undefined,
      };
    } catch (error) {
      console.error('Failed to get progress:', error);
      return null;
    }
  }

  static async clearProgress(): Promise<void> {
    try {
      this.currentProgress = null;
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }

  static async getActiveProcess(): Promise<MediaProcessingProgress | null> {
    try {
      if (!this.currentProgress) {
        return null;
      }

      // Only return if the process is active (not complete and no error)
      if (
        !this.currentProgress.progress.isComplete &&
        !this.currentProgress.progress.error
      ) {
        return {
          ...this.currentProgress.progress,
          error: this.currentProgress.progress.error || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get active process:', error);
      return null;
    }
  }

  static async isProcessing(): Promise<boolean> {
    try {
      const activeProcess = await this.getActiveProcess();
      return activeProcess !== null;
    } catch (error) {
      console.error('Failed to check if processing:', error);
      return false;
    }
  }

  static async cleanupOldProgress(): Promise<void> {
    try {
      if (!this.currentProgress) {
        return;
      }

      // Delete progress record if older than 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (this.currentProgress.createdAt < twentyFourHoursAgo) {
        this.currentProgress = null;
      }
    } catch (error) {
      console.error('Failed to cleanup old progress:', error);
    }
  }
}
