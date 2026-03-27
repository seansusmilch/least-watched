import { describe, test, expect } from 'bun:test';
import { buildArrMaps } from './arr-maps';
import type { SonarrSeries, RadarrMovie } from '@/lib/types/arr';

describe('buildArrMaps', () => {
  test('should build maps for TV series with all provider IDs', () => {
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

    const maps = buildArrMaps([series1, series2], []);

    expect(maps.tvMapByTvdb.get(100)).toBe(series1);
    expect(maps.tvMapByTvdb.get(300)).toBe(series2);
    expect(maps.tvMapByTmdb.get(200)).toBe(series1);
    expect(maps.tvMapByTmdb.get(400)).toBe(series2);
    expect(maps.tvMapByImdb.get('tt001')).toBe(series1);
    expect(maps.tvMapByImdb.get('tt002')).toBe(series2);
  });

  test('should build maps for movies with all provider IDs', () => {
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

    const maps = buildArrMaps([], [movie1, movie2]);

    expect(maps.movieMapByTmdb.get(100)).toBe(movie1);
    expect(maps.movieMapByTmdb.get(200)).toBe(movie2);
    expect(maps.movieMapByImdb.get('tt001')).toBe(movie1);
    expect(maps.movieMapByImdb.get('tt002')).toBe(movie2);
  });

  test('should handle series with missing provider IDs', () => {
    const series1: SonarrSeries = {
      id: 1,
      tvdbId: 100,
      tmdbId: undefined,
      imdbId: undefined,
    } as SonarrSeries;

    const series2: SonarrSeries = {
      id: 2,
      tvdbId: undefined,
      tmdbId: 200,
      imdbId: undefined,
    } as SonarrSeries;

    const maps = buildArrMaps([series1, series2], []);

    expect(maps.tvMapByTvdb.get(100)).toBe(series1);
    expect(maps.tvMapByTmdb.get(200)).toBe(series2);
    expect(maps.tvMapByImdb.size).toBe(0);
  });

  test('should handle movies with missing provider IDs', () => {
    const movie1: RadarrMovie = {
      id: 1,
      tmdbId: 100,
      imdbId: undefined,
    } as RadarrMovie;

    const movie2: RadarrMovie = {
      id: 2,
      tmdbId: undefined,
      imdbId: 'tt001',
    } as RadarrMovie;

    const maps = buildArrMaps([], [movie1, movie2]);

    expect(maps.movieMapByTmdb.get(100)).toBe(movie1);
    expect(maps.movieMapByImdb.get('tt001')).toBe(movie2);
  });

  test('should normalize IMDB IDs to lowercase', () => {
    const series: SonarrSeries = {
      id: 1,
      imdbId: 'TT001',
    } as SonarrSeries;

    const maps = buildArrMaps([series], []);

    expect(maps.tvMapByImdb.get('tt001')).toBe(series);
    expect(maps.tvMapByImdb.get('TT001')).toBeUndefined();
  });

  test('should handle empty arrays', () => {
    const maps = buildArrMaps([], []);

    expect(maps.tvMapByTvdb.size).toBe(0);
    expect(maps.tvMapByTmdb.size).toBe(0);
    expect(maps.tvMapByImdb.size).toBe(0);
    expect(maps.movieMapByTmdb.size).toBe(0);
    expect(maps.movieMapByImdb.size).toBe(0);
  });

  test('should handle IMDB IDs as numbers', () => {
    const series: SonarrSeries = {
      id: 1,
      imdbId: 12345 as unknown as string,
    } as SonarrSeries;

    const maps = buildArrMaps([series], []);

    expect(maps.tvMapByImdb.get('12345')).toBe(series);
  });

  test('should handle duplicate provider IDs (last one wins)', () => {
    const series1: SonarrSeries = {
      id: 1,
      tvdbId: 100,
    } as SonarrSeries;

    const series2: SonarrSeries = {
      id: 2,
      tvdbId: 100,
    } as SonarrSeries;

    const maps = buildArrMaps([series1, series2], []);

    expect(maps.tvMapByTvdb.get(100)).toBe(series2);
  });
});
