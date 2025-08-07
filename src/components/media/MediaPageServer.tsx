import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';

import { MediaPageContent } from './MediaPageContent';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';

export async function MediaPageServer() {
  // Fetch processed data
  const processedItems = await getProcessedMediaItems();

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
