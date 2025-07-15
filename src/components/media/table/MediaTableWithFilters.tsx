'use client';

import { useMemo } from 'react';
import { MediaTableBase } from './MediaTableBase';
import { MediaItem } from '@/lib/types/media';
import { useMediaFilterContext } from '../filters/MediaFilterProvider';
import { useMediaTable } from '@/hooks/useMediaTable';
import { filterAndSortMediaItems } from '@/lib/utils/mediaFilters';

interface MediaTableWithFiltersProps {
  items: MediaItem[];
}

export function MediaTableWithFilters({ items }: MediaTableWithFiltersProps) {
  const { filters, sortCriteria } = useMediaFilterContext();

  // Apply filters and sorting
  const filteredAndSortedItems = useMemo(() => {
    return filterAndSortMediaItems(items, filters, sortCriteria);
  }, [items, filters, sortCriteria]);

  // Initialize TanStack Table with pre-filtered data
  const { table } = useMediaTable(filteredAndSortedItems);

  return <MediaTableBase table={table} />;
}
