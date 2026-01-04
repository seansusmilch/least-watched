import { DateTime } from 'luxon';

export const formatDate = (date?: Date | string | null) => {
  if (!date) return 'N/A';

  const luxonDate =
    typeof date === 'string'
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return luxonDate.isValid
    ? luxonDate.toLocaleString(DateTime.DATE_SHORT)
    : 'N/A';
};

export const formatDateTime = (date?: Date | string | null) => {
  if (!date) return 'N/A';

  const luxonDate =
    typeof date === 'string'
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);
  return luxonDate.isValid
    ? luxonDate.toLocaleString(DateTime.DATETIME_SHORT)
    : 'N/A';
};

export const formatFileSize = (sizeInBytes: number | bigint) => {
  const TB = 1024 * 1024 * 1024 * 1024;
  const GB = 1024 * 1024 * 1024;

  if (sizeInBytes >= TB) {
    const tb = Number(sizeInBytes) / TB;
    return `${tb.toFixed(2)} TB`;
  } else {
    const gb = Number(sizeInBytes) / GB;
    return `${gb.toFixed(1)} GB`;
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const calculateUnwatchedDays = (
  lastWatched?: Date | string | null,
  effectiveDateAdded?: Date | string | null
): number => {
  // Handle both Date objects and ISO date strings from cached data
  const parseDate = (date?: Date | string | null): DateTime | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      const parsed = DateTime.fromISO(date);
      return parsed.isValid ? parsed : null;
    }
    return DateTime.fromJSDate(date);
  };

  const referenceLuxonDate =
    parseDate(lastWatched) || parseDate(effectiveDateAdded) || DateTime.now();
  const now = DateTime.now();

  const diffDays = Math.abs(now.diff(referenceLuxonDate, 'days').days);
  return Math.ceil(diffDays);
};

export const formatRelativeTime = (date?: Date | string | null): string => {
  if (!date) return 'N/A';

  const luxonDate =
    typeof date === 'string'
      ? DateTime.fromISO(date)
      : DateTime.fromJSDate(date);

  if (!luxonDate.isValid) return 'N/A';

  return luxonDate.toRelative() || 'N/A';
};

export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};
