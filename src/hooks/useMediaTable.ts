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
      const search = filterValue.toLowerCase();

      // Search in title, type, source, and folder
      const title = row.getValue('title') as string;
      const type = row.getValue('type') as string;
      const source = row.getValue('source') as string;
      const folder = row.getValue('parentFolder') as string;

      return (
        title?.toLowerCase().includes(search) ||
        type?.toLowerCase().includes(search) ||
        source?.toLowerCase().includes(search) ||
        folder?.toLowerCase().includes(search)
      );
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

  const getSelectedSize = () => {
    return getSelectedItems().reduce(
      (sum, item) => sum + (item.sizeOnDisk || 0),
      0
    );
  };

  return {
    table,
    // State
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    globalFilter,
    // State setters
    setSorting,
    setColumnFilters,
    setColumnVisibility,
    setRowSelection,
    setGlobalFilter,
    // Helper functions
    resetFilters,
    resetSorting,
    resetColumnVisibility,
    getSelectedItems,
    getSelectedSize,
  };
}
