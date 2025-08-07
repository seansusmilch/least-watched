import {
  MediaItem,
  SortCriteria,
  FilterOptions,
  getEffectiveDateAdded,
  type DatePreference,
} from '@/lib/types/media';
import { isMediaPathInFolder } from '@/lib/utils';

export const filterMediaItems = (
  items: MediaItem[],
  filters: FilterOptions,
  datePreference: DatePreference = 'arr'
): MediaItem[] => {
  return items.filter((item) => {
    // Basic search filter
    const matchesSearch = applySearchFilter(
      item,
      filters.searchTerm,
      filters.searchType
    );

    // Media type filter
    const matchesMediaType =
      filters.mediaTypes.size === 0 ||
      filters.mediaTypes.has(item.type as 'movie' | 'tv');

    // Source filter
    const matchesSource =
      filters.sources.size === 0 || filters.sources.has(item.source || '');

    // Watch status filters
    const matchesWatchState = applyWatchStateFilter(item, filters.watchStates);
    const matchesUnwatchedDays = applyRangeFilter(
      item.unwatchedDays,
      filters.unwatchedDaysRange
    );
    const matchesWatchCount = applyRangeFilter(
      item.watchCount,
      filters.watchCountRange
    );
    const matchesLastWatched = applyDateRangeFilter(
      item.lastWatched,
      filters.lastWatchedRange
    );

    // Quality & Size filters
    const matchesSize = applySizeFilter(item.sizeOnDisk, filters.sizeRange);
    const matchesQuality =
      filters.qualities.size === 0 || filters.qualities.has(item.quality || '');
    const matchesQualityScore = applyRangeFilter(
      item.qualityScore,
      filters.qualityScoreRange
    );
    const matchesSizePerHour = applyRangeFilter(
      item.sizePerHour,
      filters.sizePerHourRange
    );

    // Content filters
    const matchesYear = applyRangeFilter(item.year, filters.yearRange);
    const matchesGenres = applyGenreFilter(item.genres, filters.genres);
    const matchesImdbRating = applyRangeFilter(
      item.imdbRating,
      filters.ratingRange.imdb || {}
    );
    const matchesTmdbRating = applyRangeFilter(
      item.tmdbRating,
      filters.ratingRange.tmdb || {}
    );
    const matchesRuntime = applyRangeFilter(item.runtime, filters.runtimeRange);

    // TV Show specific filters
    const matchesCompletion = applyRangeFilter(
      item.completionPercentage,
      filters.completionRange
    );
    const matchesSeasonCount = applyRangeFilter(
      item.seasonCount,
      filters.seasonCountRange
    );
    const matchesEpisodeCount = applyRangeFilter(
      item.episodesOnDisk,
      filters.episodeCountRange
    );
    const matchesMonitored =
      filters.monitored === undefined || item.monitored === filters.monitored;

    // Management filters
    const effectiveDateAdded = getEffectiveDateAdded(item, datePreference);
    const matchesDateAdded = applyDateRangeFilter(
      effectiveDateAdded,
      filters.dateAddedRange
    );
    const matchesFolder = applyFolderFilter(item, filters.folders);
    const matchesDeletionScore = applyRangeFilter(
      item.deletionScore,
      filters.deletionScoreRange
    );

    // Legacy filters (for backward compatibility)
    const matchesLegacyType =
      filters.filterType === 'all' || item.type === filters.filterType;
    const matchesLegacySize =
      !filters.minSize ||
      (item.sizeOnDisk || 0) >=
        parseFloat(filters.minSize) * 1024 * 1024 * 1024;
    const matchesLegacyFolder =
      !filters.folderFilter ||
      isMediaPathInFolder(item.mediaPath, filters.folderFilter) ||
      isMediaPathInFolder(item.parentFolder, filters.folderFilter);

    return (
      matchesSearch &&
      matchesMediaType &&
      matchesSource &&
      matchesWatchState &&
      matchesUnwatchedDays &&
      matchesWatchCount &&
      matchesLastWatched &&
      matchesSize &&
      matchesQuality &&
      matchesQualityScore &&
      matchesSizePerHour &&
      matchesYear &&
      matchesGenres &&
      matchesImdbRating &&
      matchesTmdbRating &&
      matchesRuntime &&
      matchesCompletion &&
      matchesSeasonCount &&
      matchesEpisodeCount &&
      matchesMonitored &&
      matchesDateAdded &&
      matchesFolder &&
      matchesDeletionScore &&
      matchesLegacyType &&
      matchesLegacySize &&
      matchesLegacyFolder
    );
  });
};

// Helper functions for different filter types
function applySearchFilter(
  item: MediaItem,
  searchTerm: string,
  searchType: 'contains' | 'exact' | 'regex'
): boolean {
  if (!searchTerm) return true;

  const title = item.title.toLowerCase();
  const term = searchTerm.toLowerCase();

  switch (searchType) {
    case 'exact':
      return title === term;
    case 'regex':
      try {
        const regex = new RegExp(searchTerm, 'i');
        return regex.test(item.title);
      } catch {
        // If regex is invalid, fall back to contains
        return title.includes(term);
      }
    case 'contains':
    default:
      return title.includes(term);
  }
}

function applyWatchStateFilter(
  item: MediaItem,
  watchStates: Set<'watched' | 'unwatched' | 'partial'>
): boolean {
  if (watchStates.size === 0) return true;

  const isWatched = item.watchCount > 0 || item.lastWatched !== undefined;
  const isPartial =
    item.type === 'tv' &&
    !!item.completionPercentage &&
    item.completionPercentage > 0 &&
    item.completionPercentage < 100;

  if (watchStates.has('watched') && isWatched && !isPartial) return true;
  if (watchStates.has('unwatched') && !isWatched) return true;
  if (watchStates.has('partial') && isPartial) return true;

  return false;
}

function applyRangeFilter(
  value: number | null | undefined,
  range: { min?: number; max?: number }
): boolean {
  if (!range.min && !range.max) return true;
  if (value === undefined) return false;

  if (value === null) return false;

  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;

  return true;
}

function applyDateRangeFilter(
  value: Date | string | null | undefined,
  range: { start?: Date; end?: Date }
): boolean {
  if (!range.start && !range.end) return true;
  if (value === undefined) return false;

  // Convert string dates to Date objects for comparison
  const dateValue = typeof value === 'string' ? new Date(value) : value;

  if (!dateValue) return false;

  if (range.start && dateValue < range.start) return false;
  if (range.end && dateValue > range.end) return false;

  return true;
}

function applySizeFilter(
  sizeInBytes: number | bigint | null | undefined,
  sizeRange: { min?: number; max?: number; unit: 'GB' | 'MB' }
): boolean {
  if (!sizeRange.min && !sizeRange.max) return true;
  if (sizeInBytes === undefined) return false;

  const multiplier = sizeRange.unit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024;
  const sizeInUnits = Number(sizeInBytes) / multiplier;

  if (sizeRange.min !== undefined && sizeInUnits < sizeRange.min) return false;
  if (sizeRange.max !== undefined && sizeInUnits > sizeRange.max) return false;

  return true;
}

function applyGenreFilter(
  itemGenres: unknown,
  filterGenres: Set<string>
): boolean {
  const genresArray = Array.from(itemGenres as string[]);
  if (filterGenres.size === 0) return true;
  if (!genresArray || genresArray.length === 0) return false;

  // Check if any of the item's genres match any of the filter genres
  return genresArray.some((genre) => filterGenres.has(genre));
}

function applyFolderFilter(item: MediaItem, folders: Set<string>): boolean {
  if (folders.size === 0) return true;

  return Array.from(folders).some(
    (folder) =>
      isMediaPathInFolder(item.mediaPath, folder) ||
      isMediaPathInFolder(item.parentFolder, folder)
  );
}

export const sortMediaItems = (
  items: MediaItem[],
  sortCriteria: SortCriteria
): MediaItem[] => {
  return [...items].sort((a, b) => {
    const aValue = a[sortCriteria.field];
    const bValue = b[sortCriteria.field];
    const modifier = sortCriteria.order === 'asc' ? 1 : -1;

    if (aValue === bValue) return 0;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * modifier;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return (aValue.getTime() - bValue.getTime()) * modifier;
    }

    return String(aValue || '').localeCompare(String(bValue || '')) * modifier;
  });
};

export const filterAndSortMediaItems = (
  items: MediaItem[],
  filters: FilterOptions,
  sortCriteria: SortCriteria,
  datePreference: DatePreference = 'arr'
): MediaItem[] => {
  const filtered = filterMediaItems(items, filters, datePreference);
  return sortMediaItems(filtered, sortCriteria);
};

// Helper function to get unique values for filter options
export const getUniqueFilterOptions = (items: MediaItem[]) => {
  const genres = new Set<string>();
  const qualities = new Set<string>();
  const sources = new Set<string>();
  const folders = new Set<string>();

  items.forEach((item) => {
    if (item.genres) {
      const genresArray = Array.from(item.genres as string[]);
      genresArray.forEach((genre) => genres.add(genre as string));
    }
    if (item.quality) {
      qualities.add(item.quality);
    }
    if (item.source) {
      sources.add(item.source);
    }
    if (item.parentFolder) {
      folders.add(item.parentFolder);
    }
  });

  return {
    genres: Array.from(genres).sort(),
    qualities: Array.from(qualities).sort(),
    sources: Array.from(sources).sort(),
    folders: Array.from(folders).sort(),
  };
};

// Helper function to create default filter options
export const createDefaultFilters = (): FilterOptions => ({
  searchTerm: '',
  searchType: 'contains',
  mediaTypes: new Set(),
  sources: new Set(),
  watchStates: new Set(),
  unwatchedDaysRange: {},
  lastWatchedRange: {},
  watchCountRange: {},
  sizeRange: { unit: 'GB' },
  qualities: new Set(),
  qualityScoreRange: {},
  sizePerHourRange: {},
  yearRange: {},
  genres: new Set(),
  ratingRange: {},
  runtimeRange: {},
  completionRange: {},
  seasonCountRange: {},
  episodeCountRange: {},
  monitored: undefined,
  dateAddedRange: {},
  folders: new Set(),
  deletionScoreRange: {},
  filterType: 'all',
  minSize: '',
  folderFilter: '',
  filterMode: 'basic',
  savedPresetId: undefined,
});
