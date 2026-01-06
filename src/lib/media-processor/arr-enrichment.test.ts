import { describe, test, expect } from 'bun:test';
import { enrichFromRadarr, enrichFromSonarr } from './arr-enrichment';
import type { ProcessedMediaItem } from '@/lib/types/media';
import type { SonarrSeries, RadarrMovie } from '@/lib/types/arr';

describe('enrichFromRadarr', () => {
  test('should enrich movie with all Radarr data', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: '123',
      mediaPath: '/old/path',
      parentFolder: '/old',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: RadarrMovie = {
      id: 1,
      path: '/new/path/movie.mkv',
      sizeOnDisk: 5000000000,
      monitored: true,
      added: '2023-01-01T00:00:00Z',
      movieFile: {
        quality: {
          quality: {
            name: 'Bluray-1080p',
          },
        },
      },
      overview: 'Movie overview',
    } as RadarrMovie;

    enrichFromRadarr(processed, match);

    expect(processed.mediaPath).toBe('/new/path/movie.mkv');
    expect(processed.parentFolder).toBe('/new/path');
    expect(processed.sizeOnDisk).toBe(5000000000);
    expect(processed.monitored).toBe(true);
    expect(processed.dateAddedArr).toEqual(new Date('2023-01-01T00:00:00Z'));
    expect(processed.radarrId).toBe(1);
    expect(processed.quality).toBe('Bluray-1080p');
    expect(processed.overview).toBe('Movie overview');
  });

  test('should preserve existing values when Radarr data is missing', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: '123',
      mediaPath: '/existing/path',
      parentFolder: '/existing',
      sizeOnDisk: 1000,
      overview: 'Existing overview',
      source: 'Emby',
    };

    const match: RadarrMovie = {
      id: 1,
      path: undefined,
      sizeOnDisk: undefined,
      monitored: false,
      added: undefined,
      movieFile: undefined,
      overview: undefined,
    } as RadarrMovie;

    enrichFromRadarr(processed, match);

    expect(processed.mediaPath).toBe('/existing/path');
    expect(processed.parentFolder).toBe('/existing');
    expect(processed.sizeOnDisk).toBe(1000);
    expect(processed.monitored).toBe(false);
    expect(processed.dateAddedArr).toBeUndefined();
    expect(processed.radarrId).toBe(1);
    expect(processed.quality).toBeUndefined();
    expect(processed.overview).toBe('Existing overview');
  });

  test('should handle quality without nested structure', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: '123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: RadarrMovie = {
      id: 1,
      movieFile: {
        quality: {
          quality: undefined,
        },
      },
    } as RadarrMovie;

    enrichFromRadarr(processed, match);

    expect(processed.quality).toBeUndefined();
  });

  test('should handle empty path', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Movie',
      type: 'movie',
      embyId: '123',
      mediaPath: '/existing',
      parentFolder: '/existing',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: RadarrMovie = {
      id: 1,
      path: '',
    } as RadarrMovie;

    enrichFromRadarr(processed, match);

    expect(processed.mediaPath).toBe('/existing');
    expect(processed.parentFolder).toBe('/existing');
  });
});

describe('enrichFromSonarr', () => {
  test('should enrich TV series with all Sonarr data', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Series',
      type: 'tv',
      embyId: '123',
      mediaPath: '/old/path',
      parentFolder: '/old',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: SonarrSeries = {
      id: 1,
      path: '/new/path/series',
      monitored: true,
      added: '2023-01-01T00:00:00Z',
      statistics: {
        sizeOnDisk: 10000000000,
        episodeFileCount: 50,
        totalEpisodeCount: 100,
        seasonCount: 5,
      },
      overview: 'Series overview',
    } as SonarrSeries;

    enrichFromSonarr(processed, match);

    expect(processed.mediaPath).toBe('/new/path/series');
    expect(processed.parentFolder).toBe('/new/path');
    expect(processed.sizeOnDisk).toBe(10000000000);
    expect(processed.monitored).toBe(true);
    expect(processed.dateAddedArr).toEqual(new Date('2023-01-01T00:00:00Z'));
    expect(processed.sonarrId).toBe(1);
    expect(processed.episodesOnDisk).toBe(50);
    expect(processed.totalEpisodes).toBe(100);
    expect(processed.seasonCount).toBe(5);
    expect(processed.completionPercentage).toBe(50);
    expect(processed.overview).toBe('Series overview');
  });

  test('should calculate completion percentage correctly', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Series',
      type: 'tv',
      embyId: '123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: SonarrSeries = {
      id: 1,
      statistics: {
        episodeFileCount: 25,
        totalEpisodeCount: 100,
      },
    } as SonarrSeries;

    enrichFromSonarr(processed, match);

    expect(processed.completionPercentage).toBe(25);
  });

  test('should round completion percentage to nearest integer', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Series',
      type: 'tv',
      embyId: '123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: SonarrSeries = {
      id: 1,
      statistics: {
        episodeFileCount: 33,
        totalEpisodeCount: 100,
      },
    } as SonarrSeries;

    enrichFromSonarr(processed, match);

    expect(processed.completionPercentage).toBe(33);
  });

  test('should handle zero total episodes', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Series',
      type: 'tv',
      embyId: '123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: SonarrSeries = {
      id: 1,
      statistics: {
        episodeFileCount: 0,
        totalEpisodeCount: 0,
      },
    } as SonarrSeries;

    enrichFromSonarr(processed, match);

    expect(processed.completionPercentage).toBeUndefined();
  });

  test('should preserve existing values when Sonarr data is missing', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Series',
      type: 'tv',
      embyId: '123',
      mediaPath: '/existing/path',
      parentFolder: '/existing',
      sizeOnDisk: 1000,
      overview: 'Existing overview',
      source: 'Emby',
    };

    const match: SonarrSeries = {
      id: 1,
      path: undefined,
      monitored: false,
      added: undefined,
      statistics: undefined,
      overview: undefined,
    } as SonarrSeries;

    enrichFromSonarr(processed, match);

    expect(processed.mediaPath).toBe('/existing/path');
    expect(processed.parentFolder).toBe('/existing');
    expect(processed.sizeOnDisk).toBe(1000);
    expect(processed.monitored).toBe(false);
    expect(processed.dateAddedArr).toBeUndefined();
    expect(processed.sonarrId).toBe(1);
    expect(processed.episodesOnDisk).toBeUndefined();
    expect(processed.totalEpisodes).toBeUndefined();
    expect(processed.seasonCount).toBeUndefined();
    expect(processed.completionPercentage).toBeUndefined();
    expect(processed.overview).toBe('Existing overview');
  });

  test('should handle missing statistics fields', () => {
    const processed: ProcessedMediaItem = {
      title: 'Test Series',
      type: 'tv',
      embyId: '123',
      mediaPath: '',
      parentFolder: '',
      sizeOnDisk: 0,
      source: 'Emby',
    };

    const match: SonarrSeries = {
      id: 1,
      statistics: {
        sizeOnDisk: undefined,
        episodeFileCount: undefined,
        totalEpisodeCount: undefined,
        seasonCount: undefined,
      },
    } as SonarrSeries;

    enrichFromSonarr(processed, match);

    expect(processed.sizeOnDisk).toBe(0);
    expect(processed.episodesOnDisk).toBeUndefined();
    expect(processed.totalEpisodes).toBeUndefined();
    expect(processed.seasonCount).toBeUndefined();
    expect(processed.completionPercentage).toBeUndefined();
  });
});
