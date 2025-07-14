'use client';

import { useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MediaTable as MediaTableBase } from './MediaTableBase';
import { MediaTableSkeleton } from './MediaTableSkeleton';
import { MediaItem } from '@/lib/types/media';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import { MediaFilterContext } from '../filters/MediaFilterProvider';
import { getMediaItemsWithScores } from '@/lib/actions/media-processing';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';

export function MediaTable() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Data fetching with TanStack Query
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-items-with-scores'],
    queryFn: async () => {
      const rawItems = await getMediaItemsWithScores();
      const processedItems: MediaItem[] = rawItems.map((item) => ({
        ...item,
        sizeOnDisk: item.sizeOnDisk ? Number(item.sizeOnDisk) : 0,
        unwatchedDays: calculateUnwatchedDays(item.lastWatched, item.dateAdded),
        genres: item.genres ? JSON.parse(item.genres) : undefined,
      }));
      return processedItems;
    },
  });

  const {
    columnVisibility,
    tempColumnVisibility,
    isColumnPopoverOpen,
    setIsColumnPopoverOpen,
    handleTempColumnVisibilityChange,
    handleSaveColumnVisibility,
    handleOpenColumnPopover,
    handleResetColumnVisibility,
    hasUnsavedChanges,
  } = useColumnVisibility();

  // Use context if available, otherwise use local hook
  const filterContext = useContext(MediaFilterContext);
  const localFilters = useMediaFilters();

  const filterSource = filterContext || localFilters;
  const { sortCriteria, handleSort } = filterSource;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  if (isLoading) {
    return <MediaTableSkeleton />;
  }

  return (
    <MediaTableBase
      items={items}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={handleOpenColumnPopover}
      selectedItems={selectedItems}
      onSelectionChange={handleSelectItem}
      onSelectAll={handleSelectAll}
      sortCriteria={sortCriteria}
      onSort={handleSort}
      hasUnsavedChanges={hasUnsavedChanges}
      tempColumnVisibility={tempColumnVisibility}
      onTempColumnVisibilityChange={handleTempColumnVisibilityChange}
      onSaveColumnVisibility={handleSaveColumnVisibility}
      onResetColumnVisibility={handleResetColumnVisibility}
      isColumnPopoverOpen={isColumnPopoverOpen}
      setIsColumnPopoverOpen={setIsColumnPopoverOpen}
    />
  );
}
