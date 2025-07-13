import type {
  MediaItemData,
  FolderSpaceData,
  FolderWithSpace,
  FolderWithSpaceEnhanced,
} from './media-processing';

// Cached media item type with BigInt converted to number and Dates as strings
export type CachedMediaItemData = Omit<
  MediaItemData,
  'sizeOnDisk' | 'dateAdded' | 'lastWatched' | 'createdAt' | 'updatedAt'
> & {
  sizeOnDisk?: number;
  dateAdded?: string;
  lastWatched?: string;
  createdAt: string;
  updatedAt: string;
};

// Re-export other types that don't need conversion
export type { FolderSpaceData, FolderWithSpace, FolderWithSpaceEnhanced };
