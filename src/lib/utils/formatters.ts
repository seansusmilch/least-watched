import { DateTime } from 'luxon';

export const formatDate = (date?: Date | string) => {
  if (!date) return 'N/A';

  const luxonDate =
    typeof date === 'string'
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return luxonDate.isValid
    ? luxonDate.toLocaleString(DateTime.DATE_SHORT)
    : 'N/A';
};

export const formatFileSize = (sizeInBytes: number) => {
  const gb = sizeInBytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
};

export const calculateUnwatchedDays = (
  lastWatched?: Date | string,
  dateAdded?: Date | string
): number => {
  // Handle both Date objects and ISO date strings from cached data
  const parseDate = (date?: Date | string): DateTime => {
    if (!date) return DateTime.now();
    if (typeof date === 'string') {
      const parsed = DateTime.fromISO(date);
      return parsed.isValid ? parsed : DateTime.now();
    }
    return DateTime.fromJSDate(date);
  };

  const referenceLuxonDate =
    parseDate(lastWatched) || parseDate(dateAdded) || DateTime.now();
  const now = DateTime.now();

  const diffDays = Math.abs(now.diff(referenceLuxonDate, 'days').days);
  return Math.ceil(diffDays);
};
