'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaTableBase } from './MediaTableBase';
import { MediaTableSkeleton } from './MediaTableSkeleton';

import { useMediaTable } from '@/hooks/useMediaTable';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';
import { getDatePreference } from '@/lib/actions/settings/app-settings';

export function MediaTable() {
  // Data fetching with TanStack Query
  const {
    data: queryResult = { items: [], datePreference: 'arr' },
    isLoading,
  } = useQuery({
    queryKey: ['media-items'],
    queryFn: async () => {
      const [processedItems, datePreference] = await Promise.all([
        getProcessedMediaItems(),
        getDatePreference(),
      ]);
      return { items: processedItems, datePreference };
    },
  });

  const { items, datePreference } = queryResult;

  // Initialize TanStack Table
  const { table } = useMediaTable(items, datePreference);

  if (isLoading) {
    return <MediaTableSkeleton />;
  }

  return <MediaTableBase table={table} />;
}
