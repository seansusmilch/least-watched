import { type MediaProcessingProgress } from './media-processor/';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export class ProgressStore {
  static async setProgress(
    progressId: string,
    progress: MediaProcessingProgress
  ): Promise<void> {
    try {
      await prisma.mediaProcessingProgress.upsert({
        where: { progressId },
        update: {
          phase: progress.phase,
          current: progress.current,
          total: progress.total,
          currentItem: progress.currentItem,
          percentage: progress.percentage,
          isComplete: progress.isComplete || false,
          error: progress.error || null,
        },
        create: {
          progressId,
          phase: progress.phase,
          current: progress.current,
          total: progress.total,
          currentItem: progress.currentItem,
          percentage: progress.percentage,
          isComplete: progress.isComplete || false,
          error: progress.error || null,
        },
      });
    } catch (error) {
      console.error('Failed to set progress:', error);
    }
  }

  static async getProgress(
    progressId: string
  ): Promise<MediaProcessingProgress | null> {
    try {
      const record = await prisma.mediaProcessingProgress.findUnique({
        where: { progressId },
      });

      if (!record) {
        return null;
      }

      return {
        phase: record.phase,
        current: record.current,
        total: record.total,
        currentItem: record.currentItem,
        percentage: record.percentage,
        isComplete: record.isComplete,
        error: record.error || undefined,
      };
    } catch (error) {
      console.error('Failed to get progress:', error);
      return null;
    }
  }

  static async clearProgress(progressId: string): Promise<void> {
    try {
      await prisma.mediaProcessingProgress.delete({
        where: { progressId },
      });
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }

  static async getActiveProcess(): Promise<{
    progressId: string;
    progress: MediaProcessingProgress;
  } | null> {
    try {
      const record = await prisma.mediaProcessingProgress.findFirst({
        where: {
          isComplete: false,
          error: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!record) {
        return null;
      }

      return {
        progressId: record.progressId,
        progress: {
          phase: record.phase,
          current: record.current,
          total: record.total,
          currentItem: record.currentItem,
          percentage: record.percentage,
          isComplete: record.isComplete,
          error: record.error || undefined,
        },
      };
    } catch (error) {
      console.error('Failed to get active process:', error);
      return null;
    }
  }

  static async getAllProgress(): Promise<Map<string, MediaProcessingProgress>> {
    try {
      const records = await prisma.mediaProcessingProgress.findMany();
      const progressMap = new Map<string, MediaProcessingProgress>();

      for (const record of records) {
        progressMap.set(record.progressId, {
          phase: record.phase,
          current: record.current,
          total: record.total,
          currentItem: record.currentItem,
          percentage: record.percentage,
          isComplete: record.isComplete,
          error: record.error || undefined,
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
      await prisma.mediaProcessingProgress.deleteMany({
        where: {
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
      });
    } catch (error) {
      console.error('Failed to cleanup old progress:', error);
    }
  }
}
