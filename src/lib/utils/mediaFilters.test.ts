import { describe, it, expect } from 'vitest';
import {
  filterMediaItems,
  sortMediaItems,
  filterAndSortMediaItems,
  createDefaultFilters,
} from '@/lib/utils/mediaFilters';
import type { MediaItem, FilterOptions } from '@/lib/types/media';

function makeItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: 'test-id',
    title: 'Test Movie',
    type: 'movie',
    watchCount: 0,
    unwatchedDays: 0,
    lastWatched: null,
    ...overrides,
  };
}

const defaultFilters = createDefaultFilters();

describe('filterMediaItems', () => {
  describe('empty filters', () => {
    it('returns all items when all filters are at defaults', () => {
      const items = [makeItem({ id: '1' }), makeItem({ id: '2' })];
      expect(filterMediaItems(items, defaultFilters)).toHaveLength(2);
    });

    it('returns empty array when items is empty', () => {
      expect(filterMediaItems([], defaultFilters)).toHaveLength(0);
    });
  });

  describe('search filter', () => {
    const items = [
      makeItem({ id: '1', title: 'Breaking Bad' }),
      makeItem({ id: '2', title: 'Better Call Saul' }),
      makeItem({ id: '3', title: 'The Wire' }),
    ];

    it('contains: matches partial title (case-insensitive)', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        searchTerm: 'breaking',
        searchType: 'contains',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('exact: matches full title only (case-insensitive)', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        searchTerm: 'the wire',
        searchType: 'exact',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    it('exact: does not match partial title', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        searchTerm: 'wire',
        searchType: 'exact',
      });
      expect(result).toHaveLength(0);
    });

    it('regex: matches by pattern', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        searchTerm: '^b',
        searchType: 'regex',
      });
      expect(result).toHaveLength(2); // Breaking Bad, Better Call Saul
    });

    it('regex: falls back to contains on invalid regex', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        searchTerm: '[invalid',
        searchType: 'regex',
      });
      // "[invalid" as a contains search matches nothing → 0 results
      expect(result).toHaveLength(0);
    });

    it('empty searchTerm returns all items', () => {
      const result = filterMediaItems(items, { ...defaultFilters, searchTerm: '' });
      expect(result).toHaveLength(3);
    });
  });

  describe('watch state filter', () => {
    const watched = makeItem({ id: 'w', watchCount: 5 });
    const watchedByDate = makeItem({ id: 'wd', watchCount: 0, lastWatched: new Date('2023-01-01') });
    const unwatched = makeItem({ id: 'u', watchCount: 0, lastWatched: null });
    const partial = makeItem({
      id: 'p',
      type: 'tv',
      watchCount: 0,
      lastWatched: null,
      completionPercentage: 50,
    });
    const items = [watched, watchedByDate, unwatched, partial];

    it('empty watchStates returns all', () => {
      expect(filterMediaItems(items, defaultFilters)).toHaveLength(4);
    });

    it('filters to watched only', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        watchStates: new Set(['watched']),
      });
      expect(result.map((i) => i.id)).toContain('w');
      expect(result.map((i) => i.id)).toContain('wd');
    });

    it('filters to unwatched only', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        watchStates: new Set(['unwatched']),
      });
      expect(result.map((i) => i.id)).toContain('u');
    });

    it('filters to partial only (TV with 0 < completion < 100)', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        watchStates: new Set(['partial']),
      });
      expect(result.map((i) => i.id)).toContain('p');
      expect(result).toHaveLength(1);
    });
  });

  describe('range filter', () => {
    const items = [
      makeItem({ id: '10', unwatchedDays: 10 }),
      makeItem({ id: '50', unwatchedDays: 50 }),
      makeItem({ id: '100', unwatchedDays: 100 }),
    ];

    it('min only: excludes values below min', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        unwatchedDaysRange: { min: 50 },
      });
      expect(result.map((i) => i.id)).toEqual(expect.arrayContaining(['50', '100']));
      expect(result.map((i) => i.id)).not.toContain('10');
    });

    it('max only: excludes values above max', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        unwatchedDaysRange: { max: 50 },
      });
      expect(result.map((i) => i.id)).toEqual(expect.arrayContaining(['10', '50']));
      expect(result.map((i) => i.id)).not.toContain('100');
    });

    it('min and max: only includes values in range', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        unwatchedDaysRange: { min: 20, max: 80 },
      });
      expect(result.map((i) => i.id)).toEqual(['50']);
    });

    it('excludes null values when range is set', () => {
      const items2 = [
        makeItem({ id: 'null', unwatchedDays: undefined as unknown as number }),
      ];
      // unwatchedDays is not nullable in schema but range filter handles it
      const result = filterMediaItems(items2, {
        ...defaultFilters,
        unwatchedDaysRange: { min: 1 },
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('size filter', () => {
    const GB = 1024 * 1024 * 1024;
    const items = [
      makeItem({ id: 'small', sizeOnDisk: BigInt(5 * GB) }),   // 5 GB
      makeItem({ id: 'large', sizeOnDisk: BigInt(50 * GB) }),  // 50 GB
    ];

    it('GB unit: filters by gigabytes', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        sizeRange: { min: 10, unit: 'GB' },
      });
      expect(result.map((i) => i.id)).toEqual(['large']);
    });

    it('MB unit: filters by megabytes', () => {
      const MB = 1024 * 1024;
      const mbItems = [
        makeItem({ id: 'small', sizeOnDisk: BigInt(100 * MB) }),  // 100 MB
        makeItem({ id: 'large', sizeOnDisk: BigInt(5000 * MB) }), // 5000 MB
      ];
      const result = filterMediaItems(mbItems, {
        ...defaultFilters,
        sizeRange: { min: 1000, unit: 'MB' },
      });
      expect(result.map((i) => i.id)).toEqual(['large']);
    });
  });

  describe('genre filter', () => {
    const items = [
      makeItem({ id: 'action', genres: ['Action', 'Thriller'] }),
      makeItem({ id: 'drama', genres: ['Drama'] }),
      makeItem({ id: 'none', genres: [] }),
    ];

    it('empty genres returns all', () => {
      expect(filterMediaItems(items, defaultFilters)).toHaveLength(3);
    });

    it('filters to items matching any selected genre', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        genres: new Set(['Action']),
      });
      expect(result.map((i) => i.id)).toEqual(['action']);
    });

    it('excludes items with empty genre array', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        genres: new Set(['Drama']),
      });
      expect(result.map((i) => i.id)).not.toContain('none');
    });
  });

  describe('date range filter', () => {
    const items = [
      makeItem({ id: 'old', lastWatched: new Date('2022-01-01') }),
      makeItem({ id: 'mid', lastWatched: new Date('2023-06-01') }),
      makeItem({ id: 'new', lastWatched: new Date('2024-01-01') }),
    ];

    it('start only: excludes dates before start', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        lastWatchedRange: { start: new Date('2023-01-01') },
      });
      expect(result.map((i) => i.id)).toEqual(expect.arrayContaining(['mid', 'new']));
      expect(result.map((i) => i.id)).not.toContain('old');
    });

    it('end only: excludes dates after end', () => {
      const result = filterMediaItems(items, {
        ...defaultFilters,
        lastWatchedRange: { end: new Date('2023-01-01') },
      });
      expect(result.map((i) => i.id)).toEqual(['old']);
    });

    it('excludes null dates when range is set', () => {
      const items2 = [makeItem({ id: 'null', lastWatched: null })];
      const result = filterMediaItems(items2, {
        ...defaultFilters,
        lastWatchedRange: { start: new Date('2020-01-01') },
      });
      expect(result).toHaveLength(0);
    });
  });

  describe('AND logic', () => {
    it('item must match ALL conditions', () => {
      const items = [
        makeItem({ id: 'pass', title: 'Match', type: 'movie', watchCount: 0, lastWatched: null }),
        makeItem({ id: 'fail-title', title: 'Completely Different', type: 'movie', watchCount: 0, lastWatched: null }),
        makeItem({ id: 'fail-type', title: 'Match', type: 'tv', watchCount: 0, lastWatched: null }),
      ];
      const result = filterMediaItems(items, {
        ...defaultFilters,
        searchTerm: 'match',
        searchType: 'contains',
        mediaTypes: new Set(['movie']),
        watchStates: new Set(['unwatched']),
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pass');
    });
  });
});

describe('sortMediaItems', () => {
  const items = [
    makeItem({ id: 'c', title: 'C Movie', unwatchedDays: 30 }),
    makeItem({ id: 'a', title: 'A Movie', unwatchedDays: 10 }),
    makeItem({ id: 'b', title: 'B Movie', unwatchedDays: 20 }),
  ];

  it('sorts by numeric field ascending', () => {
    const result = sortMediaItems(items, { field: 'unwatchedDays', order: 'asc' });
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by numeric field descending', () => {
    const result = sortMediaItems(items, { field: 'unwatchedDays', order: 'desc' });
    expect(result.map((i) => i.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts by string field ascending', () => {
    const result = sortMediaItems(items, { field: 'title', order: 'asc' });
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by string field descending', () => {
    const result = sortMediaItems(items, { field: 'title', order: 'desc' });
    expect(result.map((i) => i.id)).toEqual(['c', 'b', 'a']);
  });

  it('does not mutate original array', () => {
    const original = [...items];
    sortMediaItems(items, { field: 'unwatchedDays', order: 'asc' });
    expect(items.map((i) => i.id)).toEqual(original.map((i) => i.id));
  });
});

describe('filterAndSortMediaItems', () => {
  it('composes filter and sort', () => {
    const items = [
      makeItem({ id: 'z', title: 'Z Movie', type: 'movie', unwatchedDays: 100 }),
      makeItem({ id: 'a', title: 'A Movie', type: 'tv', unwatchedDays: 50 }),
      makeItem({ id: 'm', title: 'M Movie', type: 'movie', unwatchedDays: 10 }),
    ];
    const result = filterAndSortMediaItems(
      items,
      { ...defaultFilters, mediaTypes: new Set(['movie']) },
      { field: 'unwatchedDays', order: 'desc' }
    );
    expect(result.map((i) => i.id)).toEqual(['z', 'm']);
  });
});
