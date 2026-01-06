import { describe, test, expect, beforeEach } from 'bun:test';
import { ProgressStore } from './progress-store';
import type { MediaProcessingProgress } from '@/lib/types/media-processing';

describe('ProgressStore', () => {
  beforeEach(async () => {
    await ProgressStore.clearProgress();
  });

  test('should store and retrieve progress', async () => {
    const progress: MediaProcessingProgress = {
      phase: 'Processing Emby Items',
      current: 5,
      total: 10,
      currentItem: 'Test Item',
      percentage: 50,
    };

    await ProgressStore.setProgress(progress);
    const retrieved = await ProgressStore.getProgress();

    expect(retrieved).toEqual(progress);
  });

  test('should clear progress', async () => {
    const progress: MediaProcessingProgress = {
      phase: 'Processing Emby Items',
      current: 5,
      total: 10,
      currentItem: 'Test Item',
      percentage: 50,
    };

    await ProgressStore.setProgress(progress);
    await ProgressStore.clearProgress();
    const retrieved = await ProgressStore.getProgress();

    expect(retrieved).toBeNull();
  });

  test('should return null when no progress is set', async () => {
    const retrieved = await ProgressStore.getProgress();
    expect(retrieved).toBeNull();
  });

  test('should update progress when set multiple times', async () => {
    const progress1: MediaProcessingProgress = {
      phase: 'Initializing',
      current: 0,
      total: 100,
      currentItem: 'Starting...',
      percentage: 0,
    };

    const progress2: MediaProcessingProgress = {
      phase: 'Processing Emby Items',
      current: 50,
      total: 100,
      currentItem: 'Halfway',
      percentage: 50,
    };

    await ProgressStore.setProgress(progress1);
    await ProgressStore.setProgress(progress2);
    const retrieved = await ProgressStore.getProgress();

    expect(retrieved).toEqual(progress2);
  });

  test('should return active process when progress is not complete', async () => {
    const progress: MediaProcessingProgress = {
      phase: 'Processing Emby Items',
      current: 5,
      total: 10,
      currentItem: 'Test Item',
      percentage: 50,
      isComplete: false,
    };

    await ProgressStore.setProgress(progress);
    const active = await ProgressStore.getActiveProcess();

    expect(active).toEqual(progress);
  });

  test('should return null for active process when progress is complete', async () => {
    const progress: MediaProcessingProgress = {
      phase: 'Complete',
      current: 10,
      total: 10,
      currentItem: 'Done',
      percentage: 100,
      isComplete: true,
    };

    await ProgressStore.setProgress(progress);
    const active = await ProgressStore.getActiveProcess();

    expect(active).toBeNull();
  });

  test('should return null for active process when isComplete is undefined but progress exists', async () => {
    const progress: MediaProcessingProgress = {
      phase: 'Processing Emby Items',
      current: 5,
      total: 10,
      currentItem: 'Test Item',
      percentage: 50,
    };

    await ProgressStore.setProgress(progress);
    const active = await ProgressStore.getActiveProcess();

    expect(active).toEqual(progress);
  });

  test('should return null for active process when no progress exists', async () => {
    const active = await ProgressStore.getActiveProcess();
    expect(active).toBeNull();
  });
});
