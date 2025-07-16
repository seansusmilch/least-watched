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
  const TB = 1024 * 1024 * 1024 * 1024;
  const GB = 1024 * 1024 * 1024;

  if (sizeInBytes >= TB) {
    const tb = sizeInBytes / TB;
    return `${tb.toFixed(2)} TB`;
  } else {
    const gb = sizeInBytes / GB;
    return `${gb.toFixed(1)} GB`;
  }
};

export const calculateUnwatchedDays = (
  lastWatched?: Date | string,
  dateAdded?: Date | string
): number => {
  // Handle both Date objects and ISO date strings from cached data
  const parseDate = (date?: Date | string): DateTime | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      const parsed = DateTime.fromISO(date);
      return parsed.isValid ? parsed : null;
    }
    return DateTime.fromJSDate(date);
  };

  const referenceLuxonDate =
    parseDate(lastWatched) || parseDate(dateAdded) || DateTime.now();
  const now = DateTime.now();

  const diffDays = Math.abs(now.diff(referenceLuxonDate, 'days').days);
  return Math.ceil(diffDays);
};
