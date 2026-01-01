'use client';

import { useState, useEffect, useRef } from 'react';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Film, SortAsc, SortDesc, Search, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MediaFiltersClient } from '../filters/MediaFiltersClient';
import { MediaItem } from '@/lib/types/media';
import { formatFileSize } from '@/lib/utils/formatters';
import { DeletionScoreBreakdown } from '../summary/DeletionScoreBreakdown';
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { DeletionPreviewDialog } from './DeletionPreviewDialog';

interface MediaTableBaseProps {
  table: TanStackTable<MediaItem>;
  availableGenres: string[];
  availableQualities: string[];
  availableSources: string[];
  availableFolders: string[];
  totalItems: number;
  embyUrl?: string | null;
  embyApiKey?: string | null;
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
}: MediaTableBaseProps) {
  const [breakdownItem, setBreakdownItem] = useState<MediaItem | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedItems = selectedRows.map((row) => row.original);
  const selectedSize = selectedRows.reduce(
    (sum, row) => sum + (Number(row.original.sizeOnDisk) || 0),
    0
  );

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 25,
  });

  const totalWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, col) => sum + col.getSize(), 0);

  const minTableWidth = Math.max(totalWidth, 1000);

  useEffect(() => {
    const container = tableContainerRef.current;
    const header = headerRef.current;

    if (!container || !header) return;

    let lastScrollTime = 0;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      const now = Date.now();
      if (now - lastScrollTime < 10) return;

      lastScrollTime = now;

      if (target.scrollLeft !== source.scrollLeft) {
        target.scrollLeft = source.scrollLeft;
      }
    };

    const handleContainerScroll = () => syncScroll(container, header);
    const handleHeaderScroll = () => syncScroll(header, container);

    container.addEventListener('scroll', handleContainerScroll, {
      passive: true,
    });
    header.addEventListener('scroll', handleHeaderScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener('scroll', handleContainerScroll);
      header.removeEventListener('scroll', handleHeaderScroll);
    };
  }, []);

  useEffect(() => {
    const handleOpenBreakdown = (event: CustomEvent) => {
      setBreakdownItem(event.detail.item);
      setShowBreakdown(true);
    };

    window.addEventListener(
      'openDeletionBreakdown',
      handleOpenBreakdown as EventListener
    );
    return () => {
      window.removeEventListener(
        'openDeletionBreakdown',
        handleOpenBreakdown as EventListener
      );
    };
  }, []);

  const handleCloseBreakdown = () => {
    setShowBreakdown(false);
    setBreakdownItem(null);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    const count = selectedRows.length;
    toast.error(`DELETE ACTION: Would delete ${count} items`, {
      description: 'Delete functionality is not yet implemented.',
      duration: 5000,
    });
  };

  const getSortIcon = (isSorted: false | 'asc' | 'desc') => {
    if (isSorted === 'asc') {
      return <SortAsc className='h-4 w-4 ml-1' />;
    } else if (isSorted === 'desc') {
      return <SortDesc className='h-4 w-4 ml-1' />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <Film className='h-5 w-5' />
            <span>Media Items</span>
          </CardTitle>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
            {selectedRows.length > 0 && (
              <div className='flex items-center justify-between md:justify-start gap-2 p-1 md:p-0'>
                <Badge variant='secondary' className='whitespace-nowrap'>
                  {selectedRows.length} selected ({formatFileSize(selectedSize)}
                  )
                </Badge>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleDeleteClick}
                  className='h-7'
                >
                  <Trash2 className='h-3 w-3 mr-1' />
                  Delete
                </Button>
              </div>
            )}
            <div className='flex items-center gap-2 w-full md:w-auto'>
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
      <CardContent>
        <div className='rounded-md border'>
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
                        className={cn(
                          'flex items-center px-4 py-2 font-medium text-left',
                          isTitle && 'flex-1 min-w-[200px]',
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none hover:bg-muted/50'
                            : ''
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        style={
                          isTitle
                            ? {}
                            : {
                                width: `${header.column.getSize()}px`,
                                minWidth: `${header.column.getSize()}px`,
                                maxWidth: `${header.column.getSize()}px`,
                                flex: 'none',
                              }
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <div className='flex items-center'>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {getSortIcon(header.column.getIsSorted())}
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
            className='h-[70vh] scrollbar-hide overflow-auto'
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
                          className={cn(
                            'flex items-center px-4 py-2',
                            isTitle && 'flex-1 min-w-[200px]'
                          )}
                          style={
                            isTitle
                              ? {}
                              : {
                                  width: `${cell.column.getSize()}px`,
                                  minWidth: `${cell.column.getSize()}px`,
                                  maxWidth: `${cell.column.getSize()}px`,
                                  flex: 'none',
                                }
                          }
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
        items={selectedItems}
        onConfirm={handleConfirmDelete}
        embyUrl={embyUrl}
        embyApiKey={embyApiKey}
      />
    </Card>
  );
}

// Keep the old name for backwards compatibility
export { MediaTableBase as MediaTable };
