'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaPageContent } from './MediaPageContent';
import { MediaTableSkeleton } from './table/MediaTableSkeleton';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';
import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';

export function MediaPageClient() {
  const { data: processedItems = [], isLoading } = useQuery({
    queryKey: ['processed-media-items'],
    queryFn: getProcessedMediaItems,
  });

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='h-32 bg-muted animate-pulse rounded' />
        <MediaTableSkeleton />
      </div>
    );
  }

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
