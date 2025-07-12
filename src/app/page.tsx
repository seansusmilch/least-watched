'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FolderSpaceWidget } from '@/components/folder-space/folder-space-widget';
import {
  MediaProcessingProgress,
  MediaSummaryCards,
  MediaFilters,
  MediaTable,
  PageActions,
} from '@/components/media';
import { useMediaItems } from '@/hooks/useMediaItems';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import { filterAndSortMediaItems } from '@/lib/utils/mediaFilters';

export default function LeastWatchedPage() {
  // Custom hooks
  const { mediaItems, loading, refresh } = useMediaItems();
  const { processing, progress, startProcessing } = useMediaProcessing(refresh);
  const { filters, sortCriteria, updateFilter, handleSort } = useMediaFilters();
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

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Derived state
  const filteredAndSortedItems = filterAndSortMediaItems(
    mediaItems,
    filters,
    sortCriteria
  );

  // Event handlers
  const handleFolderClick = (folderName: string) => {
    updateFilter('folderFilter', folderName === 'Unknown' ? '' : folderName);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAndSortedItems.map((item) => item.id)));
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

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality not yet implemented');
  };

  return (
    <AppLayout>
      <div className='space-y-6'>
        {/* Page Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Least Watched</h1>
            <p className='text-muted-foreground'>
              Identify and manage your unwatched media content
            </p>
          </div>
          <PageActions
            processing={processing}
            loading={loading}
            selectedCount={selectedItems.size}
            onProcess={startProcessing}
            onRefresh={refresh}
            onExport={handleExport}
          />
        </div>

        {/* Processing Progress */}
        {processing && <MediaProcessingProgress progress={progress} />}

        {/* Folder Space Widget */}
        <FolderSpaceWidget
          onFolderClick={handleFolderClick}
          onRefresh={refresh}
        />

        {/* Summary Cards */}
        <MediaSummaryCards
          filteredItems={filteredAndSortedItems}
          totalItems={mediaItems.length}
        />

        {/* Filters */}
        <MediaFilters filters={filters} onFilterChange={updateFilter} />

        {/* Media Table */}
        <MediaTable
          items={filteredAndSortedItems}
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
      </div>
    </AppLayout>
  );
}
