'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaTableBase } from './MediaTableBase';
import { MediaTableSkeleton } from './MediaTableSkeleton';

import { useMediaTable } from '@/hooks/useMediaTable';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';
import { getEmbySettings } from '@/lib/actions/settings/emby';

export function MediaTable() {
  // Data fetching with TanStack Query
  const { data: queryResult = { items: [], embySettings: null }, isLoading } =
    useQuery({
      queryKey: ['media-items'],
      queryFn: async () => {
        const [processedItems, embySettings] = await Promise.all([
          getProcessedMediaItems(),
          getEmbySettings(),
        ]);
        return { items: processedItems, embySettings };
      },
    });

  const { items, embySettings } = queryResult;

  // Initialize TanStack Table
  const { table } = useMediaTable(
    items,
    embySettings?.preferEmbyDateAdded || false
  );

  if (isLoading) {
    return <MediaTableSkeleton />;
  }

  return <MediaTableBase table={table} />;
}
