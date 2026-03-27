import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  startMediaProcessing,
  getMediaItems,
  getProcessedMediaItems,
  clearMediaItems,
  checkProcessingComplete,
} from './media-processing';
import { PrismaClient } from '@/generated/prisma';
import { ProgressStore } from '@/lib/media-processor/progress-store';

const prisma = new PrismaClient();

describe('Media Processing Server Actions Integration Tests', () => {
  beforeEach(async () => {
    await prisma.mediaItem.deleteMany();
    await ProgressStore.clearProgress();
  });

  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
    await ProgressStore.clearProgress();
  });

  test('should start media processing in background', async () => {
    const formData = new FormData();
    const result = await startMediaProcessing(undefined, formData);

    expect(result.success).toBe(true);
    expect(result.message).toContain('started successfully');
  });

  test('should get media items from database', async () => {
    await prisma.mediaItem.create({
      data: {
        title: 'Test Movie',
        type: 'movie',
        embyId: 'test-123',
        watchCount: 0,
        genres: null,
        deletionScore: 0,
      },
    });

    const items = await getMediaItems();

    expect(items.length).toBe(1);
    expect(items[0]?.title).toBe('Test Movie');
    expect(items[0]?.embyId).toBe('test-123');
  });

  test('should return empty array when no media items exist', async () => {
    const items = await getMediaItems();
    expect(items).toEqual([]);
  });

  test('should get processed media items with deletion scores', async () => {
    await prisma.mediaItem.create({
      data: {
        title: 'Test Movie',
        type: 'movie',
        embyId: 'test-123',
        watchCount: 0,
        dateAddedEmby: new Date('2023-01-01'),
        deletionScore: 50,
        genres: null,
      },
    });

    const items = await getProcessedMediaItems();

    expect(items.length).toBe(1);
    expect(items[0]?.title).toBe('Test Movie');
    expect(items[0]?.deletionScore).toBeDefined();
  });

  test('should clear all media items', async () => {
    await prisma.mediaItem.createMany({
      data: [
        {
          title: 'Movie 1',
          type: 'movie',
          embyId: 'test-1',
          watchCount: 0,
          genres: null,
          deletionScore: 0,
        },
        {
          title: 'Movie 2',
          type: 'movie',
          embyId: 'test-2',
          watchCount: 0,
          genres: null,
          deletionScore: 0,
        },
      ],
    });

    const result = await clearMediaItems();

    expect(result.success).toBe(true);
    expect(result.message).toContain('cleared');
    expect(result.message).toContain('2');

    const items = await getMediaItems();
    expect(items.length).toBe(0);
  });

  test('should return success message with correct count for single item', async () => {
    await prisma.mediaItem.create({
      data: {
        title: 'Movie 1',
        type: 'movie',
        embyId: 'test-1',
        watchCount: 0,
        genres: null,
        deletionScore: 0,
      },
    });

    const result = await clearMediaItems();

    expect(result.success).toBe(true);
    expect(result.message).toContain('1 media item');
  });

  test('should check processing completion status', async () => {
    await ProgressStore.setProgress({
      phase: 'Complete',
      current: 10,
      total: 10,
      currentItem: 'Done',
      percentage: 100,
      isComplete: true,
    });

    const isComplete = await checkProcessingComplete();
    expect(isComplete).toBe(true);
  });

  test('should return false when processing is not complete', async () => {
    await ProgressStore.setProgress({
      phase: 'Processing Emby Items',
      current: 5,
      total: 10,
      currentItem: 'Processing...',
      percentage: 50,
    });

    const isComplete = await checkProcessingComplete();
    expect(isComplete).toBe(false);
  });

  test('should return false when no progress exists', async () => {
    await ProgressStore.clearProgress();
    const isComplete = await checkProcessingComplete();
    expect(isComplete).toBe(false);
  });

  test('should handle errors gracefully in getMediaItems', async () => {
    const originalFindMany = prisma.mediaItem.findMany;
    prisma.mediaItem.findMany = () => {
      throw new Error('Database error');
    };

    const items = await getMediaItems();
    expect(items).toEqual([]);

    prisma.mediaItem.findMany = originalFindMany;
  });

  test('should handle errors gracefully in clearMediaItems', async () => {
    const originalDeleteMany = prisma.mediaItem.deleteMany;
    prisma.mediaItem.deleteMany = () => {
      throw new Error('Database error');
    };

    const result = await clearMediaItems();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();

    prisma.mediaItem.deleteMany = originalDeleteMany;
  });
});
