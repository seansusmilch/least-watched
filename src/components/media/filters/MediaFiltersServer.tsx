import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';
import { MediaFiltersClient } from './MediaFiltersClient';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';

export async function MediaFiltersServer() {
  // Fetch processed data to populate filter options
  const processedItems = await getProcessedMediaItems();

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
