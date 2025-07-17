import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';
import { MediaItem } from '@/lib/types/media';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';
import { MediaFiltersClient } from './MediaFiltersClient';
import { getMediaItems } from '@/lib/actions/media-processing';

export async function MediaFiltersServer() {
  // Fetch data to populate filter options
  const items = await getMediaItems();

  const processedItems: MediaItem[] = items.map((item) => ({
    ...item,
    unwatchedDays: calculateUnwatchedDays(item.lastWatched, item.dateAdded),
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
