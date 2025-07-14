'use client';

import { useMemo } from 'react';
import { MediaTableWithData } from './MediaTableWithData';
import { MediaItem } from '@/lib/types/media';
import { useMediaFilterContext } from '../filters/MediaFilterProvider';
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

  return <MediaTableWithData items={filteredAndSortedItems} />;
}
