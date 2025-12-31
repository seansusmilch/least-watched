import type { DatePreference } from '@/lib/types/media';
import type { MediaItemForScoring } from '@/lib/deletion-score-calculator';

type MediaItemLike = {
  id: string;
  sizeOnDisk?: bigint | number | null;
  dateAddedEmby?: Date | string | null;
  dateAddedArr?: Date | string | null;
  lastWatched?: Date | string | null;
  folderRemainingSpacePercent?: number | null;
};

/**
 * Normalizes sizeOnDisk value to BigInt | null
 * Handles null, undefined, number, and bigint types
 */
export function normalizeSizeOnDisk(
  sizeOnDisk: bigint | number | null | undefined
): bigint | null {
  if (sizeOnDisk === null || sizeOnDisk === undefined) {
    return null;
  }
  return typeof sizeOnDisk === 'bigint' ? sizeOnDisk : BigInt(sizeOnDisk);
}

/**
 * Normalizes date value to Date | null
 * Handles Date objects, ISO strings, null, and undefined
 */
export function normalizeDate(
  date: Date | string | null | undefined
): Date | null {
  if (!date) {
    return null;
  }
  return date instanceof Date ? date : new Date(date);
}

/**
 * Converts a MediaItem-like object to MediaItemForScoring format
 * This is a pure utility function with no side effects
 */
export function convertMediaItemToScoringFormat(
  item: MediaItemLike,
  datePreference: DatePreference,
  folderRemainingSpacePercent?: number | null
): MediaItemForScoring {
  return {
    id: item.id,
    sizeOnDisk: normalizeSizeOnDisk(item.sizeOnDisk),
    dateAddedEmby: normalizeDate(item.dateAddedEmby),
    dateAddedArr: normalizeDate(item.dateAddedArr),
    datePreference,
    lastWatched: normalizeDate(item.lastWatched),
    folderRemainingSpacePercent:
      folderRemainingSpacePercent ?? item.folderRemainingSpacePercent ?? null,
  };
}
