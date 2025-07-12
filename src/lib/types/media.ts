export interface MediaItem {
  id: string;
  title: string;
  type: string; // 'movie' | 'tv' but stored as string in database
  year?: number;
  dateAdded?: Date;
  lastWatched?: Date;
  sizeOnDisk?: number; // in bytes
  source?: string;
  mediaPath?: string;
  parentFolder?: string;
  watchCount: number;
  unwatchedDays: number;

  // Enhanced fields
  quality?: string;
  qualityScore?: number;

  // TV Show specific
  episodesOnDisk?: number;
  totalEpisodes?: number;
  seasonCount?: number;
  completionPercentage?: number;

  // Monitoring and availability
  monitored?: boolean;

  // Ratings
  imdbRating?: number;
  tmdbRating?: number;

  // Play progress
  playProgress?: number;
  fullyWatched?: boolean;

  // Size efficiency
  runtime?: number;
  sizePerHour?: number;

  // Metadata
  genres?: string[];
  overview?: string;

  // Folder space tracking
  folderRemainingSpacePercent?: number;

  // Deletion scoring
  deletionScore?: number;
}

export interface SortCriteria {
  field: keyof MediaItem;
  order: 'asc' | 'desc';
}

export interface FilterOptions {
  searchTerm: string;
  filterType: 'all' | 'movie' | 'tv';
  minSize: string;
  folderFilter: string;
}

export interface ProcessingProgress {
  processProgress: number;
  progressPhase: string;
  progressCurrentItem: string;
  progressCurrent: number;
  progressTotal: number;
}

export interface ColumnConfig {
  id: string;
  label: string;
  defaultVisible: boolean;
}
