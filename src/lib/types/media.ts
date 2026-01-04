import { z } from 'zod';

// New type for date preference setting
export type DatePreference = 'arr' | 'emby' | 'oldest';

export const MediaItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(), // 'movie' | 'tv' but stored as string in database
  year: z.number().optional().nullable(),
  dateAddedEmby: z.union([z.date(), z.string()]).optional().nullable(), // Can be Date object or ISO string from cache
  dateAddedArr: z.union([z.date(), z.string()]).optional().nullable(), // Can be Date object or ISO string from cache
  lastWatched: z.union([z.date(), z.string()]).optional().nullable(), // Can be Date object or ISO string from cache
  sizeOnDisk: z.union([z.bigint()]).optional().nullable(), // in bytes, can be number or bigint
  source: z.string().optional().nullable(),
  mediaPath: z.string().optional().nullable(),
  parentFolder: z.string().optional().nullable(),
  watchCount: z.number(),
  unwatchedDays: z.number(),

  // Enhanced fields
  quality: z.string().optional().nullable(),
  qualityScore: z.number().optional().nullable(),

  // TV Show specific
  episodesOnDisk: z.number().optional().nullable(),
  totalEpisodes: z.number().optional().nullable(),
  seasonCount: z.number().optional().nullable(),
  completionPercentage: z.number().optional().nullable(),

  // Monitoring and availability
  monitored: z.boolean().optional().nullable(),

  // Ratings
  imdbRating: z.number().optional().nullable(),
  tmdbRating: z.number().optional().nullable(),

  // Play progress
  playProgress: z.number().optional().nullable(),
  fullyWatched: z.boolean().optional().nullable(),

  // Size efficiency
  runtime: z.number().optional().nullable(),
  sizePerHour: z.number().optional().nullable(),

  // Metadata
  genres: z.unknown().optional().nullable(),
  overview: z.string().optional().nullable(),

  // Folder space tracking
  folderRemainingSpacePercent: z.number().optional().nullable(),

  // Deletion scoring
  deletionScore: z.number().optional().nullable(),

  // Computed metadata
  effectiveDateAdded: z.union([z.date(), z.string()]).optional().nullable(),

  // Emby identifier for image URLs
  embyId: z.string().optional().nullable(),

  // Arr identifiers
  sonarrId: z.number().optional().nullable(),
  radarrId: z.number().optional().nullable(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

/**
 * Helper function to get the effective dateAdded based on the date preference setting
 */
export function getEffectiveDateAdded(
  item: MediaItem,
  datePreference: DatePreference = 'arr'
): Date | null {
  const embyDate = item.dateAddedEmby
    ? typeof item.dateAddedEmby === 'string'
      ? new Date(item.dateAddedEmby)
      : item.dateAddedEmby
    : null;

  const arrDate = item.dateAddedArr
    ? typeof item.dateAddedArr === 'string'
      ? new Date(item.dateAddedArr)
      : item.dateAddedArr
    : null;

  switch (datePreference) {
    case 'emby':
      return embyDate || arrDate;
    case 'arr':
      return arrDate || embyDate;
    case 'oldest':
      if (embyDate && arrDate) {
        return embyDate < arrDate ? embyDate : arrDate;
      }
      return embyDate || arrDate;
    default:
      return arrDate || embyDate;
  }
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
