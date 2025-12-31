'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaTableSkeleton } from './MediaTableSkeleton';

import { getProcessedMediaItems } from '@/lib/actions/media-processing';
import { MediaPageContent } from '@/components/media/MediaPageContent';
import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';

export function MediaTable() {
  // Data fetching with TanStack Query
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-items'],
    queryFn: getProcessedMediaItems,
  });

  if (isLoading) {
    return <MediaTableSkeleton />;
  }

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
