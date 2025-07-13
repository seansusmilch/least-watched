import { getCachedMediaItemsWithScores } from '@/lib/cache/data-cache';
import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';
import { MediaItem } from '@/lib/types/media';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';
import { MediaFiltersClient } from './MediaFiltersClient';

export async function MediaFiltersServer() {
  // Fetch data to populate filter options
  const items = await getCachedMediaItemsWithScores();

  const processedItems: MediaItem[] = items.map((item) => ({
    ...item,
    sizeOnDisk: item.sizeOnDisk ? Number(item.sizeOnDisk) : 0,
    unwatchedDays: calculateUnwatchedDays(item.lastWatched, item.dateAdded),
    genres: item.genres ? JSON.parse(item.genres) : undefined,
  }));

  // Extract unique filter options from the data
  const filterOptions = getUniqueFilterOptions(processedItems);

  return (
    <MediaFiltersClient
      availableGenres={filterOptions.genres}
      availableQualities={filterOptions.qualities}
      availableSources={filterOptions.sources}
      availableFolders={filterOptions.folders}
      totalItems={processedItems.length}
    />
  );
}
