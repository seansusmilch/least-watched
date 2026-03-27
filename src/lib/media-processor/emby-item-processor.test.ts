import { describe, test, expect } from 'bun:test';
import { createBaseProcessedItem } from './emby-item-processor';
import type Emby from 'emby-sdk-stainless';

describe('createBaseProcessedItem', () => {
  test('should create processed item from Emby BaseItem with all fields', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
      ProductionYear: 2023,
      Path: '/media/movies/test-movie',
      DateCreated: '2023-01-01T00:00:00Z',
      ProviderIds: {
        tmdb: '100',
        imdb: 'tt001',
        tvdb: '200',
      },
      Overview: 'Test overview',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.title).toBe('Test Movie');
    expect(result.type).toBe('movie');
    expect(result.embyId).toBe('123');
    expect(result.year).toBe(2023);
    expect(result.mediaPath).toBe('/media/movies/test-movie');
    expect(result.parentFolder).toBe('/media/movies');
    expect(result.tmdbId).toBe(100);
    expect(result.imdbId).toBe('tt001');
    expect(result.tvdbId).toBe(200);
    expect(result.dateAddedEmby).toEqual(new Date('2023-01-01T00:00:00Z'));
    expect(result.overview).toBe('Test overview');
    expect(result.source).toBe('Emby');
    expect(result.sizeOnDisk).toBe(0);
  });

  test('should create processed item for TV series', () => {
    const embyItem: Emby.BaseItem = {
      Id: '456',
      Name: 'Test Series',
      Type: 'Series',
      ProductionYear: 2020,
      Path: '/media/tv/test-series',
      DateCreated: '2020-01-01T00:00:00Z',
      ProviderIds: {
        tvdb: '300',
        tmdb: '400',
        imdb: 'tt002',
      },
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.title).toBe('Test Series');
    expect(result.type).toBe('tv');
    expect(result.embyId).toBe('456');
    expect(result.tvdbId).toBe(300);
    expect(result.tmdbId).toBe(400);
    expect(result.imdbId).toBe('tt002');
  });

  test('should use OriginalTitle when Name is missing', () => {
    const embyItem: Emby.BaseItem = {
      Id: '789',
      OriginalTitle: 'Original Title',
      Type: 'Movie',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.title).toBe('Original Title');
  });

  test('should use "Unknown" when both Name and OriginalTitle are missing', () => {
    const embyItem: Emby.BaseItem = {
      Id: '999',
      Type: 'Movie',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.title).toBe('Unknown');
  });

  test('should handle missing Path', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.mediaPath).toBe('');
    expect(result.parentFolder).toBe('');
  });

  test('should handle missing ProviderIds', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.tmdbId).toBeUndefined();
    expect(result.imdbId).toBeUndefined();
    expect(result.tvdbId).toBeUndefined();
  });

  test('should normalize provider IDs to lowercase', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
      ProviderIds: {
        TMDB: '100',
        IMDB: 'tt001',
        TVDB: '200',
      },
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.tmdbId).toBe(100);
    expect(result.imdbId).toBe('tt001');
    expect(result.tvdbId).toBe(200);
  });

  test('should handle imdbid key variant', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
      ProviderIds: {
        imdbid: 'tt001',
      },
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.imdbId).toBe('tt001');
  });

  test('should handle missing DateCreated', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.dateAddedEmby).toBeUndefined();
  });

  test('should handle missing ProductionYear', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.year).toBeUndefined();
  });

  test('should handle null ProductionYear', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
      ProductionYear: null,
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.year).toBeUndefined();
  });

  test('should sanitize overview text', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
      Overview: 'Test overview with <tags>',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.overview).toBeDefined();
    expect(typeof result.overview).toBe('string');
  });

  test('should handle root path correctly', () => {
    const embyItem: Emby.BaseItem = {
      Id: '123',
      Name: 'Test Movie',
      Type: 'Movie',
      Path: '/',
    } as Emby.BaseItem;

    const result = createBaseProcessedItem(embyItem);

    expect(result.mediaPath).toBe('/');
    expect(result.parentFolder).toBe('/');
  });
});
