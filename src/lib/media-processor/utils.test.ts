import { describe, test, expect } from 'bun:test';
import {
  getQualityScore,
  calculateFolderRemainingSpacePercent,
} from './utils';
import type { FolderSpaceData } from '@/lib/types/media-processing';

describe('getQualityScore', () => {
  test('should return correct score for known quality', () => {
    expect(getQualityScore('Bluray-2160p')).toBe(100);
    expect(getQualityScore('WEBDL-1080p')).toBe(80);
    expect(getQualityScore('Bluray-720p')).toBe(70);
    expect(getQualityScore('DVD')).toBe(40);
    expect(getQualityScore('SDTV')).toBe(30);
  });

  test('should return default score for unknown quality', () => {
    expect(getQualityScore('Unknown')).toBe(20);
    expect(getQualityScore('Custom-Quality')).toBe(20);
  });

  test('should return default score for undefined quality', () => {
    expect(getQualityScore(undefined)).toBe(20);
  });

  test('should return default score for empty string', () => {
    expect(getQualityScore('')).toBe(20);
  });
});

describe('calculateFolderRemainingSpacePercent', () => {
  const folderSpaceData: FolderSpaceData[] = [
    {
      path: '/media/movies',
      label: 'Movies',
      totalSpaceGB: 1000,
      freeSpaceGB: 200,
      source: 'Radarr1',
      type: 'movie',
    },
    {
      path: '/media/tv',
      label: 'TV',
      totalSpaceGB: 2000,
      freeSpaceGB: 500,
      source: 'Sonarr1',
      type: 'tv',
    },
  ];

  test('should calculate remaining space percent correctly', () => {
    const result = calculateFolderRemainingSpacePercent(
      '/media/movies/movie1',
      folderSpaceData
    );
    expect(result).toBe(20);
  });

  test('should match folder by prefix', () => {
    const result = calculateFolderRemainingSpacePercent(
      '/media/tv/series1/season1',
      folderSpaceData
    );
    expect(result).toBe(25);
  });

  test('should match folder when folder path contains item path', () => {
    const folderData: FolderSpaceData[] = [
      {
        path: '/media',
        label: 'Media',
        totalSpaceGB: 3000,
        freeSpaceGB: 700,
        source: 'Radarr1',
        type: 'movie',
      },
    ];

    const result = calculateFolderRemainingSpacePercent(
      '/media/movies/movie1',
      folderData
    );
    expect(result).toBe(23.33);
  });

  test('should return null when no matching folder found', () => {
    const result = calculateFolderRemainingSpacePercent(
      '/other/path',
      folderSpaceData
    );
    expect(result).toBeNull();
  });

  test('should return null when parentFolder is null', () => {
    const result = calculateFolderRemainingSpacePercent(
      null,
      folderSpaceData
    );
    expect(result).toBeNull();
  });

  test('should return null when parentFolder is undefined', () => {
    const result = calculateFolderRemainingSpacePercent(
      undefined,
      folderSpaceData
    );
    expect(result).toBeNull();
  });

  test('should return null when folder has no totalSpaceGB', () => {
    const folderData: FolderSpaceData[] = [
      {
        path: '/media/movies',
        label: 'Movies',
        totalSpaceGB: 0,
        freeSpaceGB: 0,
        source: 'Radarr1',
        type: 'movie',
      },
    ];

    const result = calculateFolderRemainingSpacePercent(
      '/media/movies/movie1',
      folderData
    );
    expect(result).toBeNull();
  });

  test('should round to 2 decimal places', () => {
    const folderData: FolderSpaceData[] = [
      {
        path: '/media/movies',
        label: 'Movies',
        totalSpaceGB: 1000,
        freeSpaceGB: 333.333,
        source: 'Radarr1',
        type: 'movie',
      },
    ];

    const result = calculateFolderRemainingSpacePercent(
      '/media/movies/movie1',
      folderData
    );
    expect(result).toBe(33.33);
  });

  test('should handle empty folderSpaceData array', () => {
    const result = calculateFolderRemainingSpacePercent(
      '/media/movies/movie1',
      []
    );
    expect(result).toBeNull();
  });
});
