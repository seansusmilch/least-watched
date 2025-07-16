import { type MediaProcessingProgress } from './media-processor/';

interface ProgressRecord {
  progress: MediaProcessingProgress;
  createdAt: Date;
  updatedAt: Date;
}

export class ProgressStore {
  private static progressMap = new Map<string, ProgressRecord>();

  static async setProgress(
    progressId: string,
    progress: MediaProcessingProgress
  ): Promise<void> {
    try {
      const now = new Date();
      const existing = this.progressMap.get(progressId);

      this.progressMap.set(progressId, {
        progress: {
          ...progress,
          isComplete: progress.isComplete || false,
        },
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Failed to set progress:', error);
    }
  }

  static async getProgress(
    progressId: string
  ): Promise<MediaProcessingProgress | null> {
    try {
      const record = this.progressMap.get(progressId);

      if (!record) {
        return null;
      }

      return {
        ...record.progress,
        error: record.progress.error || undefined,
      };
    } catch (error) {
      console.error('Failed to get progress:', error);
      return null;
    }
  }

  static async clearProgress(progressId: string): Promise<void> {
    try {
      this.progressMap.delete(progressId);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }

  static async getActiveProcess(): Promise<{
    progressId: string;
    progress: MediaProcessingProgress;
  } | null> {
    try {
      // Find the most recent active (not complete, no error) process
      let mostRecentActive: {
        progressId: string;
        record: ProgressRecord;
      } | null = null;

      for (const [progressId, record] of this.progressMap.entries()) {
        if (!record.progress.isComplete && !record.progress.error) {
          if (
            !mostRecentActive ||
            record.updatedAt > mostRecentActive.record.updatedAt
          ) {
            mostRecentActive = { progressId, record };
          }
        }
      }

      if (!mostRecentActive) {
        return null;
      }

      return {
        progressId: mostRecentActive.progressId,
        progress: {
          ...mostRecentActive.record.progress,
          error: mostRecentActive.record.progress.error || undefined,
        },
      };
    } catch (error) {
      console.error('Failed to get active process:', error);
      return null;
    }
  }

  static async getAllProgress(): Promise<Map<string, MediaProcessingProgress>> {
    try {
      const progressMap = new Map<string, MediaProcessingProgress>();

      for (const [progressId, record] of this.progressMap.entries()) {
        progressMap.set(progressId, {
          ...record.progress,
          error: record.progress.error || undefined,
        });
      }

      return progressMap;
    } catch (error) {
      console.error('Failed to get all progress:', error);
      return new Map();
    }
  }

  static async cleanupOldProgress(): Promise<void> {
    try {
      // Delete progress records older than 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const [progressId, record] of this.progressMap.entries()) {
        if (record.createdAt < twentyFourHoursAgo) {
          this.progressMap.delete(progressId);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old progress:', error);
    }
  }
}
