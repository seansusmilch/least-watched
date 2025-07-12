export const formatFileSize = (sizeInGB: number) => {
  if (sizeInGB < 1024) {
    return `${sizeInGB.toFixed(1)} GB`;
  } else {
    return `${(sizeInGB / 1024).toFixed(1)} TB`;
  }
};
