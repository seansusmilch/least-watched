'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaSummaryCards } from './MediaSummaryCards';
import { MediaSummaryCardsSkeleton } from './MediaSummaryCardsSkeleton';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';

export function MediaSummaryCardsClient() {
  const { data: processedItems = [], isLoading } = useQuery({
    queryKey: ['processed-media-items'],
    queryFn: getProcessedMediaItems,
  });

  if (isLoading) {
    return <MediaSummaryCardsSkeleton />;
  }

  return (
    <MediaSummaryCards
      filteredItems={processedItems}
      totalItems={processedItems.length}
    />
  );
}
