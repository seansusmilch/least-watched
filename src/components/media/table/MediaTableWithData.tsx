'use client';

import { MediaItem } from '@/lib/types/media';
import { MediaPageContent } from '@/components/media/MediaPageContent';
import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';

interface MediaTableWithDataProps {
  items: MediaItem[];
}

export function MediaTableWithData({ items }: MediaTableWithDataProps) {
  const filterOptions = getUniqueFilterOptions(items);

  return (
    <MediaPageContent
      items={items}
      availableGenres={filterOptions.genres}
      availableQualities={filterOptions.qualities}
      availableSources={filterOptions.sources}
      availableFolders={filterOptions.folders}
    />
  );
}
