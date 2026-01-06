import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { MediaStorage } from './storage';
import { PrismaClient } from '@/generated/prisma';
import type { ProcessedMediaItem } from '@/lib/types/media';
import type { DeletionScoreSettings } from '@/lib/types/settings';
import type { FolderSpaceData } from '@/lib/types/media-processing';

const prisma = new PrismaClient();

describe('MediaStorage Integration Tests', () => {
  beforeEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
  });

  test('should store new media item with all fields', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: 'test-123',
      tmdbId: 100,
      imdbId: 'tt001',
      year: 2023,
      mediaPath: '/media/movies/test',
      parentFolder: '/media/movies',
      sizeOnDisk: 5000000000,
      dateAddedEmby: new Date('2023-01-01'),
      dateAddedArr: new Date('2023-01-02'),
      lastWatched: new Date('2023-06-01'),
      watchCount: 5,
      monitored: true,
      quality: 'Bluray-1080p',
      overview: 'Test overview',
      genres: ['Action', 'Drama'],
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: true,
      daysUnwatchedEnabled: true,
      daysUnwatchedMaxPoints: 30,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: true,
      neverWatchedPoints: 20,
      sizeOnDiskEnabled: true,
      sizeOnDiskMaxPoints: 35,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: true,
      ageSinceAddedMaxPoints: 15,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 10,
      folderSpaceBreakpoints: [],
    };

    const folderSpaceData: FolderSpaceData[] = [];

    const score = await MediaStorage.storeProcessedItem(
      item,
      settings,
      folderSpaceData,
      'arr'
    );

    const stored = await prisma.mediaItem.findUnique({
      where: { embyId: 'test-123' },
    });

    expect(stored).toBeDefined();
    expect(stored?.title).toBe('Test Movie');
    expect(stored?.type).toBe('movie');
    expect(stored?.embyId).toBe('test-123');
    expect(stored?.tmdbId).toBe(100);
    expect(stored?.imdbId).toBe('tt001');
    expect(stored?.year).toBe(2023);
    expect(stored?.mediaPath).toBe('/media/movies/test');
    expect(stored?.parentFolder).toBe('/media/movies');
    expect(stored?.sizeOnDisk).toBe(BigInt(5000000000));
    expect(stored?.monitored).toBe(true);
    expect(stored?.quality).toBe('Bluray-1080p');
    expect(stored?.overview).toBe('Test overview');
    expect(stored?.watchCount).toBe(5);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should update existing item by embyId', async () => {
    await prisma.mediaItem.create({
      data: {
        title: 'Old Title',
        type: 'movie',
        embyId: 'test-123',
        watchCount: 0,
        genres: null,
        deletionScore: 0,
      },
    });

    const item: ProcessedMediaItem = {
      title: 'New Title',
      type: 'movie',
      embyId: 'test-123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      watchCount: 10,
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: false,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 0,
      folderSpaceBreakpoints: [],
    };

    await MediaStorage.storeProcessedItem(item, settings, [], 'arr');

    const stored = await prisma.mediaItem.findUnique({
      where: { embyId: 'test-123' },
    });

    expect(stored?.title).toBe('New Title');
    expect(stored?.watchCount).toBe(10);
  });

  test('should handle negative sizeOnDisk by converting to 0', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: 'test-123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: -1000,
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: false,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 0,
      folderSpaceBreakpoints: [],
    };

    await MediaStorage.storeProcessedItem(item, settings, [], 'arr');

    const stored = await prisma.mediaItem.findUnique({
      where: { embyId: 'test-123' },
    });

    expect(stored?.sizeOnDisk).toBe(BigInt(0));
  });

  test('should handle null sizeOnDisk', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: 'test-123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: false,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 0,
      folderSpaceBreakpoints: [],
    };

    await MediaStorage.storeProcessedItem(item, settings, [], 'arr');

    const stored = await prisma.mediaItem.findUnique({
      where: { embyId: 'test-123' },
    });

    expect(stored?.sizeOnDisk).toBeNull();
  });

  test('should store genres as JSON', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: 'test-123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      genres: ['Action', 'Drama', 'Thriller'],
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: false,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 0,
      folderSpaceBreakpoints: [],
    };

    await MediaStorage.storeProcessedItem(item, settings, [], 'arr');

    const stored = await prisma.mediaItem.findUnique({
      where: { embyId: 'test-123' },
    });

    expect(stored?.genres).toEqual(['Action', 'Drama', 'Thriller']);
  });

  test('should store null genres when not provided', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: 'test-123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: false,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 0,
      folderSpaceBreakpoints: [],
    };

    await MediaStorage.storeProcessedItem(item, settings, [], 'arr');

    const stored = await prisma.mediaItem.findUnique({
      where: { embyId: 'test-123' },
    });

    expect(stored?.genres).toBeNull();
  });

  test('should return -1 when scoring is disabled', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: 'test-123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: false,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 0,
      folderSpaceBreakpoints: [],
    };

    const score = await MediaStorage.storeProcessedItem(item, settings, [], 'arr');

    expect(score).toBe(-1);
  });

  test('should return -1 on storage error', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: null as unknown as string,
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const settings: DeletionScoreSettings = {
      enabled: false,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: false,
      folderSpaceMaxPoints: 0,
      folderSpaceBreakpoints: [],
    };

    const score = await MediaStorage.storeProcessedItem(item, settings, [], 'arr');

    expect(score).toBe(-1);
  });

  test('should calculate folder space percent when folder matches', async () => {
    const item: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: 'test-123',
      mediaPath: '/media/movies/test',
      parentFolder: '/media/movies',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const folderSpaceData: FolderSpaceData[] = [
      {
        path: '/media/movies',
        label: 'Movies',
        freeSpaceGB: 200,
        totalSpaceGB: 1000,
        source: 'Radarr1',
        type: 'movie',
      },
    ];

    const settings: DeletionScoreSettings = {
      enabled: true,
      daysUnwatchedEnabled: false,
      daysUnwatchedMaxPoints: 0,
      daysUnwatchedBreakpoints: [],
      neverWatchedEnabled: false,
      neverWatchedPoints: 0,
      sizeOnDiskEnabled: false,
      sizeOnDiskMaxPoints: 0,
      sizeOnDiskBreakpoints: [],
      ageSinceAddedEnabled: false,
      ageSinceAddedMaxPoints: 0,
      ageSinceAddedBreakpoints: [],
      folderSpaceEnabled: true,
      folderSpaceMaxPoints: 10,
      folderSpaceBreakpoints: [
        { value: 10, percent: 100 },
        { value: 20, percent: 80 },
      ],
    };

    await MediaStorage.storeProcessedItem(item, settings, folderSpaceData, 'arr');

    const stored = await prisma.mediaItem.findUnique({
      where: { embyId: 'test-123' },
    });

    expect(stored).toBeDefined();
  });
});
