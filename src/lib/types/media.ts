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
  // Basic filters
  searchTerm: string;
  searchType: 'contains' | 'exact' | 'regex';
  mediaTypes: Set<'movie' | 'tv'>;
  sources: Set<string>;

  // Watch Status filters
  watchStates: Set<'watched' | 'unwatched' | 'partial'>;
  unwatchedDaysRange: { min?: number; max?: number };
  lastWatchedRange: { start?: Date; end?: Date };
  watchCountRange: { min?: number; max?: number };

  // Quality & Size filters
  sizeRange: { min?: number; max?: number; unit: 'GB' | 'MB' };
  qualities: Set<string>;
  qualityScoreRange: { min?: number; max?: number };
  sizePerHourRange: { min?: number; max?: number };

  // Content filters
  yearRange: { min?: number; max?: number };
  genres: Set<string>;
  ratingRange: {
    imdb?: { min?: number; max?: number };
    tmdb?: { min?: number; max?: number };
  };
  runtimeRange: { min?: number; max?: number };

  // TV Show specific filters
  completionRange: { min?: number; max?: number };
  seasonCountRange: { min?: number; max?: number };
  episodeCountRange: { min?: number; max?: number };
  monitored?: boolean;

  // Management filters
  dateAddedRange: { start?: Date; end?: Date };
  folders: Set<string>;
  deletionScoreRange: { min?: number; max?: number };

  // Legacy filters (for backward compatibility)
  filterType: 'all' | 'movie' | 'tv';
  minSize: string;
  folderFilter: string;

  // Meta
  filterMode: 'basic' | 'advanced';
  savedPresetId?: string;
}

// Filter preset interface
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: Partial<FilterOptions>;
  isDefault?: boolean;
  createdAt: Date;
}

// Quick filter options
export interface QuickFilterOption {
  id: string;
  label: string;
  description: string;
  icon?: string;
  filters: Partial<FilterOptions>;
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
