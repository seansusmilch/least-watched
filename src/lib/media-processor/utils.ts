import { QUALITY_SCORE_MAP } from './constants';
import type { FolderSpaceData } from '@/lib/types/media-processing';

export function getQualityScore(quality?: string): number {
  return QUALITY_SCORE_MAP[quality || 'Unknown'] || 20;
}

export function calculateFolderRemainingSpacePercent(
  parentFolder: string | null | undefined,
  folderSpaceData: FolderSpaceData[]
): number | null {
  if (!parentFolder) return null;

  const matchingFolder = folderSpaceData.find(
    (folder) =>
      parentFolder.startsWith(folder.path) ||
      folder.path.startsWith(parentFolder)
  );

  if (!matchingFolder || !matchingFolder.totalSpaceGB) {
    return null;
  }

  const remainingSpacePercent =
    (matchingFolder.freeSpaceGB / matchingFolder.totalSpaceGB) * 100;
  return Math.round(remainingSpacePercent * 100) / 100;
}
