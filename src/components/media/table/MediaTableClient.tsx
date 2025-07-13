'use client';

import { useState, useContext } from 'react';
import { MediaTable } from './MediaTable';
import { MediaItem } from '@/lib/types/media';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import { MediaFilterContext } from '../filters/MediaFilterProvider';

interface MediaTableClientProps {
  items: MediaItem[];
}

export function MediaTableClient({ items }: MediaTableClientProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  return (
    <MediaTable
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
