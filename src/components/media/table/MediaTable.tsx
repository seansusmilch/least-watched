'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaTableBase } from './MediaTableBase';
import { MediaTableSkeleton } from './MediaTableSkeleton';
import { MediaItem } from '@/lib/types/media';
import { useMediaTable } from '@/hooks/useMediaTable';
import { getMediaItems } from '@/lib/actions/media-processing';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';

export function MediaTable() {
  // Data fetching with TanStack Query
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-items'],
    queryFn: async () => {
      const rawItems = await getMediaItems();
      const processedItems: MediaItem[] = rawItems.map((item) => ({
        ...item,
        sizeOnDisk: item.sizeOnDisk ? Number(item.sizeOnDisk) : 0,
        unwatchedDays: calculateUnwatchedDays(item.lastWatched, item.dateAdded),
        genres: item.genres ? JSON.parse(item.genres) : undefined,
      }));
      return processedItems;
    },
  });

  // Initialize TanStack Table
  const { table } = useMediaTable(items);

  if (isLoading) {
    return <MediaTableSkeleton />;
  }

  return <MediaTableBase table={table} />;
}
