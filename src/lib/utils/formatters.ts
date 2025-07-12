export const formatDate = (date?: Date) => {
  return date ? date.toLocaleDateString() : 'N/A';
};

export const formatFileSize = (sizeInBytes: number) => {
  const gb = sizeInBytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
};

export const calculateUnwatchedDays = (
  lastWatched?: Date,
  dateAdded?: Date
): number => {
  const referenceDate = lastWatched || dateAdded || new Date();
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
