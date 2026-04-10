import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DeletionScoreCalculator,
  deletionScoreCalculator,
  type MediaItemForScoring,
} from '@/lib/deletion-score-calculator';
import type { DeletionScoreSettings } from '@/lib/types/settings';

// Fixed "now" so date-based calculations are deterministic
const FIXED_NOW = new Date('2024-01-01T00:00:00.000Z').getTime();

const BASE_SETTINGS: DeletionScoreSettings = {
  enabled: true,

  daysUnwatchedEnabled: true,
  daysUnwatchedMaxPoints: 40,
  daysUnwatchedBreakpoints: [
    { value: 365, percent: 100 },
    { value: 180, percent: 75 },
    { value: 90, percent: 50 },
    { value: 30, percent: 25 },
  ],

  neverWatchedEnabled: true,
  neverWatchedPoints: 10,

  sizeOnDiskEnabled: true,
  sizeOnDiskMaxPoints: 30,
  sizeOnDiskBreakpoints: [
    { value: 50, percent: 100 },
    { value: 20, percent: 75 },
    { value: 10, percent: 50 },
    { value: 5, percent: 25 },
  ],

  ageSinceAddedEnabled: true,
  ageSinceAddedMaxPoints: 10,
  ageSinceAddedBreakpoints: [
    { value: 730, percent: 100 },
    { value: 365, percent: 50 },
  ],

  folderSpaceEnabled: false,
  folderSpaceMaxPoints: 10,
  folderSpaceBreakpoints: [
    { value: 50, percent: 100 },
    { value: 20, percent: 50 },
  ],
};

function daysAgo(days: number): Date {
  return new Date(FIXED_NOW - days * 24 * 60 * 60 * 1000);
}

function gbToBytes(gb: number): bigint {
  return BigInt(Math.round(gb * 1024 * 1024 * 1024));
}

describe('DeletionScoreCalculator', () => {
  let calc: DeletionScoreCalculator;

  beforeEach(() => {
    calc = new DeletionScoreCalculator();
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateScore – guard clauses', () => {
    it('returns 0 for null item', () => {
      expect(calc.calculateScore(null as unknown as MediaItemForScoring, BASE_SETTINGS)).toBe(0);
    });

    it('returns 0 for item without id', () => {
      expect(calc.calculateScore({} as MediaItemForScoring, BASE_SETTINGS)).toBe(0);
    });

    it('returns 0 when settings is null', () => {
      const item: MediaItemForScoring = { id: 'a' };
      expect(calc.calculateScore(item, null as unknown as DeletionScoreSettings)).toBe(0);
    });

    it('returns 0 when settings.enabled is false', () => {
      const item: MediaItemForScoring = { id: 'a', lastWatched: daysAgo(400) };
      expect(calc.calculateScore(item, { ...BASE_SETTINGS, enabled: false })).toBe(0);
    });
  });

  describe('daysUnwatched factor', () => {
    it('awards points when unwatched days exceed breakpoint', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: daysAgo(400), // > 365 → 100% of 40 = 40
        dateAddedArr: daysAgo(400),
      };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(40);
    });

    it('uses lastWatched as reference when present', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: daysAgo(200), // > 180 → 75% of 40 = 30
        dateAddedArr: daysAgo(500),
      };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(30);
    });

    it('falls back to dateAdded when lastWatched is null', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: null,
        dateAddedArr: daysAgo(100), // > 90 → 50% of 40 = 20
      };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(20);
    });

    it('returns 0 points when value does not exceed any breakpoint', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: daysAgo(10), // ≤ 30 → 0 points
        dateAddedArr: daysAgo(10),
      };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(0);
    });

    it('awards 0 when factor is disabled', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: daysAgo(400),
      };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: false,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(0);
    });
  });

  describe('neverWatched factor', () => {
    it('awards bonus when lastWatched is null', () => {
      const item: MediaItemForScoring = { id: 'a', lastWatched: null };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(10);
    });

    it('does not award bonus when lastWatched is set', () => {
      const item: MediaItemForScoring = { id: 'a', lastWatched: daysAgo(400) };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(0);
    });

    it('does not award bonus when factor is disabled', () => {
      const item: MediaItemForScoring = { id: 'a', lastWatched: null };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: false,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(0);
    });
  });

  describe('sizeOnDisk factor', () => {
    it('converts BigInt bytes to GB correctly (60 GB → 100% of 30 = 30)', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        sizeOnDisk: gbToBytes(60), // > 50 GB → 100% of 30 = 30
        lastWatched: daysAgo(1),
      };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: false,
        neverWatchedEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(30);
    });

    it('awards 0 when sizeOnDisk is null', () => {
      const item: MediaItemForScoring = { id: 'a', sizeOnDisk: null };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: false,
        neverWatchedEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(0);
    });

    it('awards 0 when factor is disabled', () => {
      const item: MediaItemForScoring = { id: 'a', sizeOnDisk: gbToBytes(100) };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: false,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(score).toBe(0);
    });
  });

  describe('score capping', () => {
    it('caps total score at 100', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: null,
        sizeOnDisk: gbToBytes(100),
        dateAddedArr: daysAgo(1000),
        folderRemainingSpacePercent: 5,
      };
      const score = calc.calculateScore(item, {
        ...BASE_SETTINGS,
        folderSpaceEnabled: true,
        folderSpaceBreakpoints: [{ value: 10, percent: 100 }],
      });
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('date preference', () => {
    const embyDate = daysAgo(100);
    const arrDate = daysAgo(200);

    it('uses emby date when preference is "emby"', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: null,
        dateAddedEmby: embyDate,
        dateAddedArr: arrDate,
        datePreference: 'emby',
      };
      const bd = calc.calculateScoreBreakdown(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: true,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      // dateAdded = emby (100 days ago) is used as reference when lastWatched=null
      expect(bd.daysUnwatched.daysSince).toBe(100);
    });

    it('uses arr date when preference is "arr"', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: null,
        dateAddedEmby: embyDate,
        dateAddedArr: arrDate,
        datePreference: 'arr',
      };
      const bd = calc.calculateScoreBreakdown(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: true,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(bd.daysUnwatched.daysSince).toBe(200);
    });

    it('uses oldest date when preference is "oldest"', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: null,
        dateAddedEmby: embyDate,   // 100 days ago
        dateAddedArr: arrDate,     // 200 days ago (older)
        datePreference: 'oldest',
      };
      const bd = calc.calculateScoreBreakdown(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: true,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(bd.daysUnwatched.daysSince).toBe(200);
    });

    it('falls back to arrDate when emby preference but embyDate is null', () => {
      const item: MediaItemForScoring = {
        id: 'a',
        lastWatched: null,
        dateAddedEmby: null,
        dateAddedArr: arrDate,
        datePreference: 'emby',
      };
      const bd = calc.calculateScoreBreakdown(item, {
        ...BASE_SETTINGS,
        daysUnwatchedEnabled: true,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(bd.daysUnwatched.daysSince).toBe(200);
    });
  });

  describe('calculateScoresForItems', () => {
    it('returns a Map keyed by item id', () => {
      const items: MediaItemForScoring[] = [
        { id: 'x', lastWatched: daysAgo(400) },
        { id: 'y', lastWatched: daysAgo(10) },
      ];
      const map = calc.calculateScoresForItems(items, BASE_SETTINGS);
      expect(map).toBeInstanceOf(Map);
      expect(map.has('x')).toBe(true);
      expect(map.has('y')).toBe(true);
    });

    it('returns empty Map for non-array input', () => {
      const map = calc.calculateScoresForItems(null as unknown as MediaItemForScoring[], BASE_SETTINGS);
      expect(map.size).toBe(0);
    });

    it('scores each item independently', () => {
      const items: MediaItemForScoring[] = [
        { id: 'high', lastWatched: daysAgo(400) },
        { id: 'low', lastWatched: daysAgo(10) },
      ];
      const map = calc.calculateScoresForItems(items, {
        ...BASE_SETTINGS,
        neverWatchedEnabled: false,
        sizeOnDiskEnabled: false,
        ageSinceAddedEnabled: false,
      });
      expect(map.get('high')!).toBeGreaterThan(map.get('low')!);
    });
  });

  describe('singleton export', () => {
    it('deletionScoreCalculator is a DeletionScoreCalculator instance', () => {
      expect(deletionScoreCalculator).toBeInstanceOf(DeletionScoreCalculator);
    });
  });
});
