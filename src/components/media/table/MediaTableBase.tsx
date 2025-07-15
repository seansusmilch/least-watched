'use client';

import { useState, useEffect, useRef } from 'react';
import { flexRender, Table as TanStackTable } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Film, SortAsc, SortDesc } from 'lucide-react';
import { MediaItem } from '@/lib/types/media';
import { formatFileSize } from '@/lib/utils/formatters';
import { DeletionScoreBreakdown } from '../summary/DeletionScoreBreakdown';
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown';
import { GlobalFilter } from './GlobalFilter';
import { useVirtualizer } from '@tanstack/react-virtual';

interface MediaTableBaseProps {
  table: TanStackTable<MediaItem>;
}

export function MediaTableBase({ table }: MediaTableBaseProps) {
  const [breakdownItem, setBreakdownItem] = useState<MediaItem | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedSize = selectedRows.reduce(
    (sum, row) => sum + (row.original.sizeOnDisk || 0),
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

  // Calculate total width needed for all columns
  const totalWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, col) => sum + col.getSize(), 0);

  // Sync header scroll with content scroll
  useEffect(() => {
    const container = tableContainerRef.current;
    const header = headerRef.current;

    if (!container || !header) return;

    const handleScroll = () => {
      header.scrollLeft = container.scrollLeft;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for deletion breakdown events
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
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <Film className='h-5 w-5' />
            <span>Media Items</span>
          </CardTitle>
          <div className='flex items-center space-x-2'>
            <GlobalFilter table={table} />
            {selectedRows.length > 0 && (
              <Badge variant='secondary'>
                {selectedRows.length} selected ({formatFileSize(selectedSize)})
              </Badge>
            )}
            <ColumnVisibilityDropdown
              table={table}
              open={columnPopoverOpen}
              onOpenChange={setColumnPopoverOpen}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          {/* Fixed Header */}
          <div
            ref={headerRef}
            className='border-b bg-background sticky top-0 z-10 overflow-x-auto scrollbar-hide'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div style={{ minWidth: `${totalWidth}px` }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className='flex'>
                  {headerGroup.headers.map((header) => (
                    <div
                      key={header.id}
                      className={`flex items-center px-4 py-2 font-medium text-left ${
                        header.column.getCanSort()
                          ? 'cursor-pointer select-none hover:bg-muted/50'
                          : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        width: `${header.column.getSize()}px`,
                        minWidth: `${header.column.getSize()}px`,
                        maxWidth: `${header.column.getSize()}px`,
                        flex: 'none',
                      }}
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
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Virtual Content Container */}
          <div
            ref={tableContainerRef}
            style={{
              height: '550px',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                minWidth: `${totalWidth}px`,
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
                    {row.getVisibleCells().map((cell) => (
                      <div
                        key={cell.id}
                        className='flex items-center px-4 py-2'
                        style={{
                          width: `${cell.column.getSize()}px`,
                          minWidth: `${cell.column.getSize()}px`,
                          maxWidth: `${cell.column.getSize()}px`,
                          flex: 'none',
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Deletion Score Breakdown Dialog */}
      {breakdownItem && (
        <DeletionScoreBreakdown
          item={breakdownItem}
          open={showBreakdown}
          onClose={handleCloseBreakdown}
        />
      )}
    </Card>
  );
}

// Keep the old name for backwards compatibility
export { MediaTableBase as MediaTable };
