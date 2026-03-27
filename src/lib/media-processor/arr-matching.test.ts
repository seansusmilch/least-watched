import { describe, test, expect } from 'bun:test';
import {
  normalizeProviderIds,
  findRadarrMatch,
  findSonarrMatch,
} from './arr-matching';
import type { SonarrSeries, RadarrMovie } from '@/lib/types/arr';

describe('normalizeProviderIds', () => {
  test('should normalize provider IDs to lowercase keys', () => {
    const input = {
      TMDB: '123',
      TVDB: '456',
      IMDB: 'tt789',
    };
    const result = normalizeProviderIds(input);
    expect(result).toEqual({
      tmdb: '123',
      tvdb: '456',
      imdb: 'tt789',
    });
  });

  test('should convert values to strings', () => {
    const input: Record<string, string | number> = {
      tmdb: 123,
      tvdb: 456,
    };
    const result = normalizeProviderIds(input as Record<string, string>);
    expect(result).toEqual({
      tmdb: '123',
      tvdb: '456',
    });
  });

  test('should return empty object for undefined input', () => {
    const result = normalizeProviderIds(undefined);
    expect(result).toEqual({});
  });

  test('should handle empty object', () => {
    const result = normalizeProviderIds({});
    expect(result).toEqual({});
  });

  test('should handle mixed case keys', () => {
    const input = {
      TmDb: '123',
      tVdB: '456',
      ImDb: 'tt789',
    };
    const result = normalizeProviderIds(input);
    expect(result).toEqual({
      tmdb: '123',
      tvdb: '456',
      imdb: 'tt789',
    });
  });
});

describe('findRadarrMatch', () => {
  const movie1: RadarrMovie = {
    id: 1,
    tmdbId: 100,
    imdbId: 'tt001',
  } as RadarrMovie;

  const movie2: RadarrMovie = {
    id: 2,
    tmdbId: 200,
    imdbId: 'tt002',
  } as RadarrMovie;

  const movieMapByTmdb = new Map<number, RadarrMovie>();
  movieMapByTmdb.set(100, movie1);
  movieMapByTmdb.set(200, movie2);

  const movieMapByImdb = new Map<string, RadarrMovie>();
  movieMapByImdb.set('tt001', movie1);
  movieMapByImdb.set('tt002', movie2);

  test('should find match by TMDB ID', () => {
    const result = findRadarrMatch(100, undefined, movieMapByTmdb, movieMapByImdb);
    expect(result).toBe(movie1);
  });

  test('should find match by IMDB ID when TMDB is null', () => {
    const result = findRadarrMatch(null, 'tt001', movieMapByTmdb, movieMapByImdb);
    expect(result).toBe(movie1);
  });

  test('should prefer TMDB ID over IMDB ID', () => {
    const result = findRadarrMatch(200, 'tt001', movieMapByTmdb, movieMapByImdb);
    expect(result).toBe(movie2);
  });

  test('should handle case-insensitive IMDB ID matching', () => {
    const result = findRadarrMatch(null, 'TT001', movieMapByTmdb, movieMapByImdb);
    expect(result).toBe(movie1);
  });

  test('should return undefined when no match found', () => {
    const result = findRadarrMatch(999, 'tt999', movieMapByTmdb, movieMapByImdb);
    expect(result).toBeUndefined();
  });

  test('should return undefined when both IDs are null', () => {
    const result = findRadarrMatch(null, null, movieMapByTmdb, movieMapByImdb);
    expect(result).toBeUndefined();
  });

  test('should return undefined when both IDs are undefined', () => {
    const result = findRadarrMatch(undefined, undefined, movieMapByTmdb, movieMapByImdb);
    expect(result).toBeUndefined();
  });
});

describe('findSonarrMatch', () => {
  const series1: SonarrSeries = {
    id: 1,
    tvdbId: 100,
    tmdbId: 200,
    imdbId: 'tt001',
  } as SonarrSeries;

  const series2: SonarrSeries = {
    id: 2,
    tvdbId: 300,
    tmdbId: 400,
    imdbId: 'tt002',
  } as SonarrSeries;

  const tvMapByTvdb = new Map<number, SonarrSeries>();
  tvMapByTvdb.set(100, series1);
  tvMapByTvdb.set(300, series2);

  const tvMapByTmdb = new Map<number, SonarrSeries>();
  tvMapByTmdb.set(200, series1);
  tvMapByTmdb.set(400, series2);

  const tvMapByImdb = new Map<string, SonarrSeries>();
  tvMapByImdb.set('tt001', series1);
  tvMapByImdb.set('tt002', series2);

  test('should find match by TVDB ID (highest priority)', () => {
    const result = findSonarrMatch(100, 400, 'tt002', tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBe(series1);
  });

  test('should find match by TMDB ID when TVDB is null', () => {
    const result = findSonarrMatch(null, 200, 'tt002', tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBe(series1);
  });

  test('should find match by IMDB ID when TVDB and TMDB are null', () => {
    const result = findSonarrMatch(null, null, 'tt001', tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBe(series1);
  });

  test('should prioritize TVDB > TMDB > IMDB', () => {
    const result = findSonarrMatch(300, 200, 'tt001', tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBe(series2);
  });

  test('should handle case-insensitive IMDB ID matching', () => {
    const result = findSonarrMatch(null, null, 'TT001', tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBe(series1);
  });

  test('should return undefined when no match found', () => {
    const result = findSonarrMatch(999, 999, 'tt999', tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBeUndefined();
  });

  test('should return undefined when all IDs are null', () => {
    const result = findSonarrMatch(null, null, null, tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBeUndefined();
  });

  test('should return undefined when all IDs are undefined', () => {
    const result = findSonarrMatch(undefined, undefined, undefined, tvMapByTvdb, tvMapByTmdb, tvMapByImdb);
    expect(result).toBeUndefined();
  });
});
