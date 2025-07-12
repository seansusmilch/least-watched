import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to get selected folders for an instance
export function getSelectedFolders(settingsString: string | null): string[] {
  if (!settingsString) return [];
  try {
    return JSON.parse(settingsString);
  } catch {
    return [];
  }
}

// Helper function to normalize paths for cross-platform comparison
export function normalizePathForComparison(path: string): string {
  if (!path) return '';
  // Convert backslashes to forward slashes and ensure no trailing slash
  let normalized = path.replace(/\\/g, '/').toLowerCase();
  // Remove trailing slash except for root paths
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

// Helper function to check if a media path is within a selected folder
export function isMediaPathInFolder(
  mediaPath: string | undefined,
  folderPath: string
): boolean {
  if (!mediaPath || !folderPath) return false;

  const normalizedMediaPath = normalizePathForComparison(mediaPath);
  const normalizedFolderPath = normalizePathForComparison(folderPath);

  // Check if the media path starts with the folder path
  return normalizedMediaPath.startsWith(normalizedFolderPath);
}
