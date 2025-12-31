import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useState, useMemo, useEffect } from 'react';
import { MediaItem } from '@/lib/types/media';
import { createMediaTableColumns } from '@/components/media/table/mediaTableColumns';
import {
  loadColumnVisibility,
  saveColumnVisibility,
} from '@/lib/utils/columnConfig';

export function useMediaTable(data: MediaItem[] = []) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => loadColumnVisibility()
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const globalSearchColumnIds = useMemo(
    () => new Set<string>(['title', 'type', 'source', 'folder']),
    []
  );

  // Save column visibility changes to localStorage
  useEffect(() => {
    saveColumnVisibility(columnVisibility);
  }, [columnVisibility]);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => createMediaTableColumns(), []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    enableMultiSort: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableSorting: true,
    enableHiding: true,
    // Custom filter functions
    filterFns: {
      fuzzy: (row, columnId, value) => {
        const itemRank = row.getValue(columnId) as string;
        return itemRank?.toLowerCase().includes(value.toLowerCase()) ?? false;
      },
    },
    // Global filter function
    globalFilterFn: (row, columnId, filterValue) => {
      if (!globalSearchColumnIds.has(columnId)) return false;

      const search = String(filterValue ?? '').toLowerCase();
      if (!search) return true;

      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;

      return String(value).toLowerCase().includes(search);
    },
  });

  // Helper functions for common operations
  const resetFilters = () => {
    setColumnFilters([]);
    setGlobalFilter('');
  };

  const resetSorting = () => {
    setSorting([]);
  };

  const resetColumnVisibility = () => {
    setColumnVisibility(loadColumnVisibility());
  };

  const getSelectedItems = () => {
    return table.getSelectedRowModel().rows.map((row) => row.original);
  };

  const getSelectedItemIds = () => {
    return table.getSelectedRowModel().rows.map((row) => row.original.id);
  };

  const getSelectedItemSize = () => {
    return table
      .getSelectedRowModel()
      .rows.reduce(
        (sum, row) => sum + (Number(row.original.sizeOnDisk) || 0),
        0
      );
  };

  const clearSelection = () => {
    table.toggleAllRowsSelected(false);
  };

  const selectAll = () => {
    table.toggleAllRowsSelected(true);
  };

  const selectItemsByIds = (ids: string[]) => {
    table.toggleAllRowsSelected(false);
    ids.forEach((id) => {
      const row = table
        .getRowModel()
        .rows.find((row) => row.original.id === id);
      if (row) {
        row.toggleSelected(true);
      }
    });
  };

  return {
    table,
    resetFilters,
    resetSorting,
    resetColumnVisibility,
    getSelectedItems,
    getSelectedItemIds,
    getSelectedItemSize,
    clearSelection,
    selectAll,
    selectItemsByIds,
  };
}
