'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaTableBase } from './MediaTableBase';
import { MediaTableSkeleton } from './MediaTableSkeleton';

import { useMediaTable } from '@/hooks/useMediaTable';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';

export function MediaTable() {
  // Data fetching with TanStack Query
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-items'],
    queryFn: getProcessedMediaItems,
  });

  // Initialize TanStack Table
  const { table } = useMediaTable(items);

  if (isLoading) {
    return <MediaTableSkeleton />;
  }

  return <MediaTableBase table={table} />;
}
