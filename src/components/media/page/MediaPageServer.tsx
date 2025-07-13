import { getCachedMediaItemsWithScores } from '@/lib/cache/data-cache';
import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';
import { MediaItem } from '@/lib/types/media';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';
import { MediaPageContent } from './MediaPageContent';

export async function MediaPageServer() {
  // Fetch data
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
    <MediaPageContent
      items={processedItems}
      availableGenres={filterOptions.genres}
      availableQualities={filterOptions.qualities}
      availableSources={filterOptions.sources}
      availableFolders={filterOptions.folders}
    />
  );
}
