'use client';

import { useState, useRef } from 'react';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Film, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { MediaFiltersClient } from '../filters/MediaFiltersClient';
import { MediaItem } from '@/lib/types/media';
import { DeletionScoreBreakdown } from '../summary/DeletionScoreBreakdown';
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DeletionPreviewDialog } from './DeletionPreviewDialog';
import { deleteMediaItems } from '@/lib/actions/media-items';
import { MediaTableNavigationButton } from './MediaTableNavigationButton';
import { MediaTableSelectionControls } from './MediaTableSelectionControls';
import { MediaTableSortIcon } from './MediaTableSortIcon';
import { cn } from '@/lib/utils';
import {
  getCardClasses,
  getCardContentClasses,
  getTableHeightClass,
} from '@/lib/utils/tableStyles';
import {
  getHeaderCellClasses,
  getCellClasses,
  getFixedColumnStyles,
} from '@/lib/utils/tableCellStyles';
import { useTableScrollSync } from '@/hooks/useTableScrollSync';
import { useDeletionBreakdown } from '@/hooks/useDeletionBreakdown';
import {
  VIRTUALIZER_CONFIG,
  MIN_TABLE_WIDTH,
} from '@/lib/constants/table';

interface MediaTableBaseProps {
  table: TanStackTable<MediaItem>;
  availableGenres: string[];
  availableQualities: string[];
  availableSources: string[];
  availableFolders: string[];
  totalItems: number;
  embyUrl?: string | null;
  embyApiKey?: string | null;
  fullscreen?: boolean;
}

export function MediaTableBase({
  table,
  availableGenres,
  availableQualities,
  availableSources,
  availableFolders,
  totalItems,
  embyUrl,
  embyApiKey,
  fullscreen = false,
}: MediaTableBaseProps) {
  const queryClient = useQueryClient();
  const { breakdownItem, showBreakdown, handleCloseBreakdown } =
    useDeletionBreakdown();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);

  const selectedTableRows = table.getSelectedRowModel().rows;
  const selectedMediaItems = selectedTableRows.map((row) => row.original);
  const selectedSize = selectedTableRows.reduce(
    (sum, row) => sum + (Number(row.original.sizeOnDisk) || 0),
    0
  );

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => VIRTUALIZER_CONFIG.estimateSize,
    overscan: VIRTUALIZER_CONFIG.overscan,
  });

  const totalWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, col) => sum + col.getSize(), 0);

  const minTableWidth = Math.max(totalWidth, MIN_TABLE_WIDTH);

  useTableScrollSync(tableContainerRef, headerRef);


  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);

    const { sonarrCount, radarrCount, failedCount } = await deleteMediaItems(
      selectedMediaItems
    );
    const successCount = sonarrCount + radarrCount;

    if (successCount) {
      queryClient.invalidateQueries({ queryKey: ['media-items'] });
      queryClient.invalidateQueries({ queryKey: ['processed-media-items'] });
      queryClient.invalidateQueries({ queryKey: ['media-summary'] });
      queryClient.refetchQueries({ queryKey: ['media-items'], type: 'active' });

      table.resetRowSelection();

      if (failedCount > 0) {
        toast.warning(
          `Deleted ${successCount} items (${sonarrCount} Sonarr, ${radarrCount} Radarr), but ${failedCount} failed`
        );
      } else {
        toast.success(
          `Successfully deleted ${successCount} items (${sonarrCount} Sonarr, ${radarrCount} Radarr)`
        );
      }
    } else {
      toast.error(`Failed to delete ${failedCount} items`);
    }
  };

  return (
    <Card className={getCardClasses(fullscreen)}>
      <CardHeader>
        <div className='flex flex-row items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <Film className='h-5 w-5' />
            <span>Media Items</span>
          </CardTitle>
          {!fullscreen && (
            <MediaTableNavigationButton fullscreen={fullscreen} />
          )}
        </div>
        <div className='flex flex-col gap-3'>
          <MediaTableSelectionControls
            selectedCount={selectedTableRows.length}
            selectedSize={selectedSize}
            onDeleteClick={handleDeleteClick}
          />
          <div className='flex items-center gap-2 w-full'>
            <div className='relative flex-1 md:flex-none'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                aria-label='Search media'
                placeholder='Search...'
                value={(table.getState().globalFilter as string) ?? ''}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
                className='h-8 w-full md:w-[200px] pl-8'
              />
            </div>
            <div className='flex items-center gap-2 ml-auto'>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant='outline' size='sm' aria-label='Open filters'>
                    <Filter className='h-4 w-4 mr-2' /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side='right' className='w-full md:max-w-md p-0'>
                  <MediaFiltersClient
                    availableGenres={availableGenres}
                    availableQualities={availableQualities}
                    availableSources={availableSources}
                    availableFolders={availableFolders}
                    totalItems={totalItems}
                  />
                </SheetContent>
              </Sheet>
              <ColumnVisibilityDropdown
                table={table}
                open={columnPopoverOpen}
                onOpenChange={setColumnPopoverOpen}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={getCardContentClasses(fullscreen)}>
        <div className='rounded-md border h-full flex flex-col'>
          <div
            ref={headerRef}
            className='border-b bg-background sticky top-0 z-10 overflow-x-auto scrollbar-hide'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div style={{ minWidth: `${minTableWidth}px` }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className='flex'>
                  {headerGroup.headers.map((header) => {
                    const isTitle = header.column.id === 'title';

                    return (
                      <div
                        key={header.id}
                        className={getHeaderCellClasses(
                          isTitle,
                          header.column.getCanSort()
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        style={isTitle ? {} : getFixedColumnStyles(header.column.getSize())}
                      >
                        {header.isPlaceholder ? null : (
                          <div className='flex items-center'>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            <MediaTableSortIcon
                              sortState={header.column.getIsSorted()}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div
            data-testid='media-table'
            ref={tableContainerRef}
            className={cn(
              'scrollbar-hide overflow-auto flex-1',
              getTableHeightClass(fullscreen)
            )}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                minWidth: `${minTableWidth}px`,
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className='flex border-b hover:bg-muted/50'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isTitle = cell.column.id === 'title';

                      return (
                        <div
                          key={cell.id}
                          className={getCellClasses(isTitle)}
                          style={isTitle ? {} : getFixedColumnStyles(cell.column.getSize())}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>

      {breakdownItem && (
        <DeletionScoreBreakdown
          item={breakdownItem}
          open={showBreakdown}
          onClose={handleCloseBreakdown}
        />
      )}

      <DeletionPreviewDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        items={selectedMediaItems}
        onConfirm={handleConfirmDelete}
        embyUrl={embyUrl}
        embyApiKey={embyApiKey}
      />
    </Card>
  );
}

// Keep the old name for backwards compatibility
export { MediaTableBase as MediaTable };
