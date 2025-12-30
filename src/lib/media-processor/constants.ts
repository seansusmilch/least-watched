// Configuration constants
export const TESTING_LIMIT = 10; // Limit number of items processed per instance for testing

// Quality mapping for scoring
export const QUALITY_SCORE_MAP: Record<string, number> = {
  'Bluray-2160p': 100,
  'WEBDL-2160p': 95,
  'WEBRip-2160p': 90,
  'Bluray-1080p': 85,
  'WEBDL-1080p': 80,
  'WEBRip-1080p': 75,
  'Bluray-720p': 70,
  'WEBDL-720p': 65,
  'WEBRip-720p': 60,
  'HDTV-1080p': 55,
  'HDTV-720p': 50,
  DVD: 40,
  SDTV: 30,
  Unknown: 20,
};

// Utility functions
export function getQualityScore(quality?: string): number {
  return QUALITY_SCORE_MAP[quality || 'Unknown'] || 20;
}

export function calculateFolderRemainingSpacePercent(
  parentFolder: string | undefined,
  folderSpaceData: Array<{
    path: string;
    totalSpaceGB?: number;
    freeSpaceGB: number;
  }>
): number | null {
  if (!parentFolder) return null;

  // Find matching folder space data
  const matchingFolder = folderSpaceData.find(
    (folder) =>
      parentFolder.startsWith(folder.path) ||
      folder.path.startsWith(parentFolder)
  );

  if (!matchingFolder || !matchingFolder.totalSpaceGB) {
    return null;
  }

  // Calculate remaining space percentage
  const remainingSpacePercent =
    (matchingFolder.freeSpaceGB / matchingFolder.totalSpaceGB) * 100;
  return Math.round(remainingSpacePercent * 100) / 100; // Round to 2 decimal places
}
