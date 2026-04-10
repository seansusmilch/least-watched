import { describe, it, expect } from 'vitest';
import {
  normalizeSizeOnDisk,
  normalizeDate,
  convertMediaItemToScoringFormat,
} from '@/lib/utils/media-scoring';

describe('normalizeSizeOnDisk', () => {
  it('returns null for null input', () => {
    expect(normalizeSizeOnDisk(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeSizeOnDisk(undefined)).toBeNull();
  });

  it('passes through bigint unchanged', () => {
    const big = BigInt(12345678);
    expect(normalizeSizeOnDisk(big)).toBe(big);
  });

  it('converts number to BigInt', () => {
    expect(normalizeSizeOnDisk(1024)).toBe(BigInt(1024));
  });

  it('converts 0 to BigInt(0)', () => {
    expect(normalizeSizeOnDisk(0)).toBe(BigInt(0));
  });
});

describe('normalizeDate', () => {
  it('returns null for null input', () => {
    expect(normalizeDate(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeDate(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeDate('')).toBeNull();
  });

  it('passes through a Date object unchanged', () => {
    const d = new Date('2023-01-01');
    expect(normalizeDate(d)).toBe(d);
  });

  it('converts ISO string to Date', () => {
    const result = normalizeDate('2023-06-15T00:00:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2023-06-15T00:00:00.000Z');
  });
});

describe('convertMediaItemToScoringFormat', () => {
  const baseItem = {
    id: 'abc',
    sizeOnDisk: 1024 as unknown as bigint,
    dateAddedEmby: '2023-01-01T00:00:00.000Z',
    dateAddedArr: new Date('2022-06-01'),
    lastWatched: null,
    folderRemainingSpacePercent: 42,
  };

  it('maps id correctly', () => {
    const result = convertMediaItemToScoringFormat(baseItem, 'arr');
    expect(result.id).toBe('abc');
  });

  it('normalizes sizeOnDisk to bigint', () => {
    const result = convertMediaItemToScoringFormat(baseItem, 'arr');
    expect(typeof result.sizeOnDisk).toBe('bigint');
  });

  it('normalizes dateAddedEmby string to Date', () => {
    const result = convertMediaItemToScoringFormat(baseItem, 'arr');
    expect(result.dateAddedEmby).toBeInstanceOf(Date);
  });

  it('passes through dateAddedArr Date as-is', () => {
    const result = convertMediaItemToScoringFormat(baseItem, 'arr');
    expect(result.dateAddedArr).toBeInstanceOf(Date);
  });

  it('sets datePreference correctly', () => {
    expect(convertMediaItemToScoringFormat(baseItem, 'emby').datePreference).toBe('emby');
    expect(convertMediaItemToScoringFormat(baseItem, 'oldest').datePreference).toBe('oldest');
  });

  it('uses explicit folderRemainingSpacePercent override', () => {
    const result = convertMediaItemToScoringFormat(baseItem, 'arr', 99);
    expect(result.folderRemainingSpacePercent).toBe(99);
  });

  it('falls back to item.folderRemainingSpacePercent when no override', () => {
    const result = convertMediaItemToScoringFormat(baseItem, 'arr');
    expect(result.folderRemainingSpacePercent).toBe(42);
  });

  it('handles null sizeOnDisk', () => {
    const result = convertMediaItemToScoringFormat({ id: 'x', sizeOnDisk: null }, 'arr');
    expect(result.sizeOnDisk).toBeNull();
  });

  it('handles item with only required fields', () => {
    const result = convertMediaItemToScoringFormat({ id: 'min' }, 'arr');
    expect(result.id).toBe('min');
    expect(result.sizeOnDisk).toBeNull();
    expect(result.dateAddedEmby).toBeNull();
    expect(result.dateAddedArr).toBeNull();
    expect(result.lastWatched).toBeNull();
    expect(result.folderRemainingSpacePercent).toBeNull();
  });
});
