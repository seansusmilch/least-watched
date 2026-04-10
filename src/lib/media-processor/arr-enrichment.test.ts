import { describe, it, expect } from 'vitest';
import path from 'path';
import { enrichFromRadarr, enrichFromSonarr } from '@/lib/media-processor/arr-enrichment';
import type { ProcessedMediaItem } from '@/lib/types/media';
import type { RadarrMovie, SonarrSeries } from '@/lib/types/arr';

function makeProcessed(overrides: Partial<ProcessedMediaItem> = {}): ProcessedMediaItem {
  return {
    title: 'Test',
    type: 'movie',
    mediaPath: '/old/path/movie.mkv',
    parentFolder: '/old/path',
    sizeOnDisk: 0,
    source: 'radarr',
    embyId: 'emby-1',
    ...overrides,
  };
}

describe('enrichFromRadarr', () => {
  const match = {
    id: 42,
    path: '/movies/Inception (2010)/Inception.mkv',
    sizeOnDisk: 12345678,
    movieFile: {
      quality: {
        quality: { name: '1080p' },
      },
    },
    monitored: true,
    added: '2022-03-15T00:00:00Z',
    overview: 'A thief who steals corporate secrets.',
  } as unknown as RadarrMovie;

  it('sets mediaPath from match', () => {
    const item = makeProcessed();
    enrichFromRadarr(item, match);
    expect(item.mediaPath).toBe('/movies/Inception (2010)/Inception.mkv');
  });

  it('derives parentFolder via path.dirname', () => {
    const item = makeProcessed();
    enrichFromRadarr(item, match);
    expect(item.parentFolder).toBe(path.dirname('/movies/Inception (2010)/Inception.mkv'));
  });

  it('sets sizeOnDisk', () => {
    const item = makeProcessed();
    enrichFromRadarr(item, match);
    expect(item.sizeOnDisk).toBe(12345678);
  });

  it('sets quality via deep optional chain', () => {
    const item = makeProcessed();
    enrichFromRadarr(item, match);
    expect(item.quality).toBe('1080p');
  });

  it('sets quality to undefined when movieFile is absent', () => {
    const noFile = { ...match, movieFile: undefined } as unknown as RadarrMovie;
    const item = makeProcessed();
    enrichFromRadarr(item, noFile);
    expect(item.quality).toBeUndefined();
  });

  it('sets monitored', () => {
    const item = makeProcessed();
    enrichFromRadarr(item, match);
    expect(item.monitored).toBe(true);
  });

  it('sets dateAddedArr from added string', () => {
    const item = makeProcessed();
    enrichFromRadarr(item, match);
    expect(item.dateAddedArr).toBeInstanceOf(Date);
    expect(item.dateAddedArr!.toISOString()).toBe('2022-03-15T00:00:00.000Z');
  });

  it('sets radarrId', () => {
    const item = makeProcessed();
    enrichFromRadarr(item, match);
    expect(item.radarrId).toBe(42);
  });

  it('prefers arr overview over existing emby overview', () => {
    const item = makeProcessed({ overview: 'Emby overview' });
    enrichFromRadarr(item, match);
    expect(item.overview).toBe('A thief who steals corporate secrets.');
  });

  it('falls back to existing overview when arr overview is empty', () => {
    const emptyOverview = { ...match, overview: '' } as unknown as RadarrMovie;
    const item = makeProcessed({ overview: 'Emby overview' });
    enrichFromRadarr(item, emptyOverview);
    expect(item.overview).toBe('Emby overview');
  });

  it('preserves existing mediaPath when match.path is falsy', () => {
    const noPath = { ...match, path: undefined } as unknown as RadarrMovie;
    const item = makeProcessed({ mediaPath: '/kept/path.mkv' });
    enrichFromRadarr(item, noPath);
    expect(item.mediaPath).toBe('/kept/path.mkv');
  });
});

describe('enrichFromSonarr', () => {
  const match = {
    id: 99,
    path: '/tv/Breaking Bad',
    statistics: {
      sizeOnDisk: 50000000,
      episodeFileCount: 62,
      totalEpisodeCount: 62,
      seasonCount: 5,
    },
    monitored: true,
    added: '2020-01-01T00:00:00Z',
    overview: 'A chemistry teacher turns to crime.',
  } as unknown as SonarrSeries;

  it('sets mediaPath', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.mediaPath).toBe('/tv/Breaking Bad');
  });

  it('derives parentFolder via path.dirname', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.parentFolder).toBe(path.dirname('/tv/Breaking Bad'));
  });

  it('sets sizeOnDisk from statistics', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.sizeOnDisk).toBe(50000000);
  });

  it('sets episodesOnDisk and totalEpisodes', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.episodesOnDisk).toBe(62);
    expect(item.totalEpisodes).toBe(62);
  });

  it('sets seasonCount', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.seasonCount).toBe(5);
  });

  it('calculates completionPercentage correctly (62/62 = 100%)', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.completionPercentage).toBe(100);
  });

  it('calculates partial completionPercentage (31/62 = 50%)', () => {
    const partial = {
      ...match,
      statistics: { ...match.statistics, episodeFileCount: 31, totalEpisodeCount: 62 },
    } as unknown as SonarrSeries;
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, partial);
    expect(item.completionPercentage).toBe(50);
  });

  it('sets completionPercentage to undefined when totalEpisodeCount is 0 (avoids division by zero)', () => {
    const noEpisodes = {
      ...match,
      statistics: { ...match.statistics, episodeFileCount: 0, totalEpisodeCount: 0 },
    } as unknown as SonarrSeries;
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, noEpisodes);
    expect(item.completionPercentage).toBeUndefined();
  });

  it('sets sonarrId', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.sonarrId).toBe(99);
  });

  it('sets dateAddedArr', () => {
    const item = makeProcessed({ type: 'tv' });
    enrichFromSonarr(item, match);
    expect(item.dateAddedArr).toBeInstanceOf(Date);
  });
});
