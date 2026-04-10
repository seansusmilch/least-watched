import { describe, it, expect } from 'vitest';
import {
  normalizeProviderIds,
  findRadarrMatch,
  findSonarrMatch,
} from '@/lib/media-processor/arr-matching';
import type { RadarrMovie, SonarrSeries } from '@/lib/types/arr';

function makeRadarrMovie(overrides: Partial<RadarrMovie> = {}): RadarrMovie {
  return { id: 1, tmdbId: 100, imdbId: 'tt0001', title: 'Test Movie', ...overrides } as RadarrMovie;
}

function makeSonarrSeries(overrides: Partial<SonarrSeries> = {}): SonarrSeries {
  return { id: 1, tvdbId: 200, title: 'Test Series', ...overrides } as SonarrSeries;
}

describe('normalizeProviderIds', () => {
  it('returns empty object for undefined input', () => {
    expect(normalizeProviderIds(undefined)).toEqual({});
  });

  it('lowercases all keys', () => {
    expect(normalizeProviderIds({ TMDB: '123', IMDB: 'tt0001' })).toEqual({
      tmdb: '123',
      imdb: 'tt0001',
    });
  });

  it('converts values to strings', () => {
    expect(normalizeProviderIds({ tmdb: 123 as unknown as string })).toEqual({
      tmdb: '123',
    });
  });

  it('handles empty object', () => {
    expect(normalizeProviderIds({})).toEqual({});
  });
});

describe('findRadarrMatch', () => {
  const movie = makeRadarrMovie({ id: 1, tmdbId: 100, imdbId: 'tt0001' });
  const movieMapByTmdb = new Map([[100, movie]]);
  const movieMapByImdb = new Map([['tt0001', movie]]);

  it('matches by TMDB ID first', () => {
    expect(findRadarrMatch(100, 'tt0001', movieMapByTmdb, movieMapByImdb)).toBe(movie);
  });

  it('falls back to IMDB when TMDB not found', () => {
    const emptyTmdb = new Map<number, RadarrMovie>();
    expect(findRadarrMatch(999, 'tt0001', emptyTmdb, movieMapByImdb)).toBe(movie);
  });

  it('IMDB lookup is case-insensitive', () => {
    const lowerImdbMap = new Map([['tt0001', movie]]);
    expect(findRadarrMatch(null, 'TT0001', new Map(), lowerImdbMap)).toBe(movie);
  });

  it('returns undefined when no match found', () => {
    expect(findRadarrMatch(999, 'tt9999', new Map(), new Map())).toBeUndefined();
  });

  it('returns undefined when both IDs are null', () => {
    expect(findRadarrMatch(null, null, movieMapByTmdb, movieMapByImdb)).toBeUndefined();
  });

  it('returns undefined when both IDs are undefined', () => {
    expect(findRadarrMatch(undefined, undefined, movieMapByTmdb, movieMapByImdb)).toBeUndefined();
  });
});

describe('findSonarrMatch', () => {
  const series = makeSonarrSeries({ id: 1, tvdbId: 200 });
  const tvMapByTvdb = new Map([[200, series]]);
  const tvMapByTmdb = new Map([[300, series]]);
  const tvMapByImdb = new Map([['tt0002', series]]);

  it('matches by TVDB first', () => {
    expect(
      findSonarrMatch(200, 300, 'tt0002', tvMapByTvdb, tvMapByTmdb, tvMapByImdb)
    ).toBe(series);
  });

  it('falls back to TMDB when TVDB not found', () => {
    const emptyTvdb = new Map<number, SonarrSeries>();
    expect(
      findSonarrMatch(null, 300, 'tt0002', emptyTvdb, tvMapByTmdb, tvMapByImdb)
    ).toBe(series);
  });

  it('falls back to IMDB when TVDB and TMDB not found', () => {
    const emptyTvdb = new Map<number, SonarrSeries>();
    const emptyTmdb = new Map<number, SonarrSeries>();
    expect(
      findSonarrMatch(null, null, 'tt0002', emptyTvdb, emptyTmdb, tvMapByImdb)
    ).toBe(series);
  });

  it('IMDB lookup is case-insensitive', () => {
    const emptyTvdb = new Map<number, SonarrSeries>();
    const emptyTmdb = new Map<number, SonarrSeries>();
    expect(
      findSonarrMatch(null, null, 'TT0002', emptyTvdb, emptyTmdb, tvMapByImdb)
    ).toBe(series);
  });

  it('returns undefined when no ID matches', () => {
    expect(
      findSonarrMatch(999, 999, 'tt9999', new Map(), new Map(), new Map())
    ).toBeUndefined();
  });

  it('returns undefined when all IDs are null', () => {
    expect(
      findSonarrMatch(null, null, null, tvMapByTvdb, tvMapByTmdb, tvMapByImdb)
    ).toBeUndefined();
  });
});
