# Adopting TanStack Table for Media Table Implementation

## Overview

This document outlines a comprehensive plan to migrate the current MediaTable implementation from a custom table built with shadcn/ui components to TanStack Table, a powerful headless table library that provides better state management, performance, and flexibility.

## Current Implementation Analysis

### Existing Components
- **MediaTable.tsx** - Main component with TanStack Query integration
- **MediaTableBase.tsx** - Core table implementation with custom UI
- **MediaTableSkeleton.tsx** - Loading skeleton
- **MediaTableWithData.tsx** - Component accepting pre-loaded data
- **MediaTableWithFilters.tsx** - Component with filtering integration

### Current Features
- Column visibility management with popover UI
- Single-column sorting
- Row selection (single and bulk)
- Integration with MediaFilterProvider context
- Custom deletion score breakdown modal
- 14 different column types with custom rendering
- Responsive design with shadcn/ui components

## Benefits of Migration

### Performance Improvements
- **Virtualization Support**: Built-in support for large datasets
- **Optimized Re-renders**: Better state management reduces unnecessary re-renders
- **Memory Efficiency**: Better handling of large datasets

### Enhanced Features
- **Multi-column Sorting**: Native support for sorting by multiple columns
- **Advanced Filtering**: Built-in filter functions and custom filter support
- **Improved Accessibility**: Better keyboard navigation and screen reader support
- **Pagination**: Built-in pagination with customizable page sizes
- **Column Resizing**: Native column resizing capabilities
- **Column Pinning**: Pin important columns to left/right

### Developer Experience
- **TypeScript Support**: Full TypeScript integration with type safety
- **Consistent API**: Standardized patterns across all table features
- **Better State Management**: Centralized state with external control options
- **Headless Architecture**: Complete control over UI while leveraging logic

## Migration Plan

### Phase 1: Core Table Structure Setup

#### 1.1 Install Dependencies
```bash
bun add @tanstack/react-table
```

#### 1.2 Create Column Definitions
Create `src/lib/utils/mediaTableColumns.tsx`:
```typescript
import { createColumnHelper } from '@tanstack/react-table'
import { MediaItem } from '@/lib/types/media'

const columnHelper = createColumnHelper<MediaItem>()

export const mediaTableColumns = [
  // Selection column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),

  // Title column
  columnHelper.accessor('title', {
    header: 'Title',
    cell: info => info.getValue(),
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'includesString',
  }),

  // Type column
  columnHelper.accessor('type', {
    header: 'Type',
    cell: info => {
      const type = info.getValue()
      return (
        <Badge variant={type === 'movie' ? 'default' : 'secondary'}>
          {type === 'movie' ? (
            <>
              <Film className='h-3 w-3 mr-1' /> Movie
            </>
          ) : (
            <>
              <Tv className='h-3 w-3 mr-1' /> Series
            </>
          )}
        </Badge>
      )
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'equals',
  }),

  // Additional columns for year, size, quality, completion, rating, source, folder, dateAdded, lastWatched, unwatchedDays, deletionScore
  // ... (detailed column definitions)
]
```

#### 1.3 Create Base Table Hook
Create `src/hooks/useMediaTable.ts`:
```typescript
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, ColumnFiltersState, SortingState, VisibilityState, PaginationState } from '@tanstack/react-table'
import { useState, useMemo } from 'react'
import { MediaItem } from '@/lib/types/media'
import { mediaTableColumns } from '@/lib/utils/mediaTableColumns'

export function useMediaTable(data: MediaItem[] = []) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })

  const table = useReactTable({
    data,
    columns: mediaTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    enableMultiSort: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableSorting: true,
  })

  return {
    table,
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
    setSorting,
    setColumnFilters,
    setColumnVisibility,
    setRowSelection,
    setPagination,
  }
}
```

### Phase 2: Update Table Components

#### 2.1 Refactor MediaTableBase.tsx
```typescript
'use client'

import { flexRender, Table as TanStackTable } from '@tanstack/react-table'
import { MediaItem } from '@/lib/types/media'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Film, Columns } from 'lucide-react'
import { formatFileSize } from '@/lib/utils/formatters'
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown'

interface MediaTableBaseProps {
  table: TanStackTable<MediaItem>
}

export function MediaTableBase({ table }: MediaTableBaseProps) {
  const selectedRows = table.getSelectedRowModel().rows
  const selectedSize = selectedRows.reduce((sum, row) => sum + (row.original.sizeOnDisk || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <Film className='h-5 w-5' />
            <span>Media Items</span>
          </CardTitle>
          <div className='flex items-center space-x-2'>
            {selectedRows.length > 0 && (
              <Badge variant='secondary'>
                {selectedRows.length} selected ({formatFileSize(selectedSize)})
              </Badge>
            )}
            <ColumnVisibilityDropdown table={table} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={
                        header.column.getCanSort()
                          ? 'cursor-pointer select-none hover:bg-muted/50'
                          : ''
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className='flex items-center'>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && (
                            <SortAsc className='h-4 w-4 ml-1' />
                          )}
                          {header.column.getIsSorted() === 'desc' && (
                            <SortDesc className='h-4 w-4 ml-1' />
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### 2.2 Update MediaTable.tsx
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { MediaTableBase } from './MediaTableBase'
import { MediaTableSkeleton } from './MediaTableSkeleton'
import { MediaItem } from '@/lib/types/media'
import { useMediaTable } from '@/hooks/useMediaTable'
import { getMediaItemsWithScores } from '@/lib/actions/media-processing'
import { calculateUnwatchedDays } from '@/lib/utils/formatters'

export function MediaTable() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-items-with-scores'],
    queryFn: async () => {
      const rawItems = await getMediaItemsWithScores()
      const processedItems: MediaItem[] = rawItems.map((item) => ({
        ...item,
        sizeOnDisk: item.sizeOnDisk ? Number(item.sizeOnDisk) : 0,
        unwatchedDays: calculateUnwatchedDays(item.lastWatched, item.dateAdded),
        genres: item.genres ? JSON.parse(item.genres) : undefined,
      }))
      return processedItems
    },
  })

  const { table } = useMediaTable(items)

  if (isLoading) {
    return <MediaTableSkeleton />
  }

  return <MediaTableBase table={table} />
}
```

### Phase 3: Enhanced Features Implementation

#### 3.1 Column Visibility Management
Create `src/components/media/table/ColumnVisibilityDropdown.tsx`:
```typescript
import { Table as TanStackTable } from '@tanstack/react-table'
import { MediaItem } from '@/lib/types/media'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Columns } from 'lucide-react'

interface ColumnVisibilityDropdownProps {
  table: TanStackTable<MediaItem>
}

export function ColumnVisibilityDropdown({ table }: ColumnVisibilityDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm'>
          <Columns className='h-4 w-4 mr-2' />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-48'>
        <div className='mb-3'>
          <h4 className='font-medium text-sm'>Column Visibility</h4>
          <p className='text-xs text-muted-foreground'>
            Select which columns to display in the table
          </p>
        </div>
        <div className='grid gap-2'>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <div key={column.id} className='flex items-center'>
                <Checkbox
                  id={`column-${column.id}`}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(checked)}
                />
                <Label htmlFor={`column-${column.id}`} className='ml-2'>
                  {column.columnDef.header as string}
                </Label>
              </div>
            ))}
        </div>
        <div className='flex justify-end space-x-2 mt-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.resetColumnVisibility()}
          >
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

#### 3.2 Global Filter Implementation
Create `src/components/media/table/GlobalFilter.tsx`:
```typescript
import { Table as TanStackTable } from '@tanstack/react-table'
import { MediaItem } from '@/lib/types/media'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface GlobalFilterProps {
  table: TanStackTable<MediaItem>
}

export function GlobalFilter({ table }: GlobalFilterProps) {
  return (
    <div className='relative'>
      <Search className='h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground' />
      <Input
        placeholder='Search all columns...'
        value={(table.getState().globalFilter as string) ?? ''}
        onChange={(event) => table.setGlobalFilter(String(event.target.value))}
        className='pl-8'
      />
    </div>
  )
}
```

#### 3.3 Pagination Component
Create `src/components/media/table/TablePagination.tsx`:
```typescript
import { Table as TanStackTable } from '@tanstack/react-table'
import { MediaItem } from '@/lib/types/media'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface TablePaginationProps {
  table: TanStackTable<MediaItem>
}

export function TablePagination({ table }: TablePaginationProps) {
  return (
    <div className='flex items-center justify-between px-2 py-4'>
      <div className='flex items-center space-x-2'>
        <p className='text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </p>
      </div>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        <div className='flex items-center space-x-2'>
          <p className='text-sm font-medium'>Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center space-x-2'>
          <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              className='h-8 w-8 p-0'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Phase 4: Integration with Existing Systems

#### 4.1 Context Integration
Update `src/hooks/useMediaTable.ts` to support context integration:
```typescript
import { useContext } from 'react'
import { MediaFilterContext } from '@/components/media/filters/MediaFilterProvider'

export function useMediaTable(data: MediaItem[] = []) {
  const filterContext = useContext(MediaFilterContext)
  
  // Initialize states based on context if available
  const [sorting, setSorting] = useState<SortingState>(
    filterContext?.sortCriteria ? 
    [{ id: filterContext.sortCriteria.field, desc: filterContext.sortCriteria.order === 'desc' }] : 
    []
  )
  
  // Sync with context when sorting changes
  useEffect(() => {
    if (filterContext && sorting.length > 0) {
      const sort = sorting[0]
      filterContext.handleSort(sort.id as keyof MediaItem)
    }
  }, [sorting, filterContext])

  // ... rest of implementation
}
```

#### 4.2 Filter Integration
Update column definitions to support external filters:
```typescript
// In mediaTableColumns.tsx
export const createMediaTableColumns = (filters?: MediaFilters) => {
  return [
    // ... existing columns with filter integration
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => {
        // ... existing cell rendering
      },
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValues) => {
        if (!filterValues || filterValues.length === 0) return true
        return filterValues.includes(row.getValue(columnId))
      },
    }),
    // ... other columns
  ]
}
```

### Phase 5: Performance Optimizations

#### 5.1 Virtualization Setup
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

// In MediaTableBase component
const tableContainerRef = useRef<HTMLDivElement>(null)

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 60,
  overscan: 10,
})

// Update table body rendering to use virtual rows
```

#### 5.2 Memoization
```typescript
// In useMediaTable hook
const columns = useMemo(() => createMediaTableColumns(filters), [filters])

const table = useReactTable({
  data,
  columns,
  // ... other options
})
```

### Phase 6: Testing Strategy

#### 6.1 Unit Tests
- Test column definitions and rendering
- Test sorting functionality
- Test filtering behavior
- Test row selection
- Test pagination

#### 6.2 Integration Tests
- Test context integration
- Test TanStack Query integration
- Test filter synchronization
- Test performance with large datasets

#### 6.3 E2E Tests
- Test user interactions
- Test responsive behavior
- Test accessibility features

### Phase 7: Migration Steps

#### Step 1: Prepare Foundation
1. Install TanStack Table dependencies
2. Create column definitions
3. Create base table hook
4. Set up TypeScript types

#### Step 2: Component Migration
1. Update MediaTableBase to use TanStack Table
2. Update MediaTable with new hook
3. Update MediaTableWithData
4. Update MediaTableWithFilters

#### Step 3: Feature Enhancement
1. Add column visibility management
2. Add global filtering
3. Add pagination
4. Add multi-column sorting

#### Step 4: Integration
1. Update context integration
2. Update filter synchronization
3. Update performance optimizations
4. Add virtualization if needed

#### Step 5: Testing & Refinement
1. Run comprehensive tests
2. Performance testing
3. Accessibility testing
4. User acceptance testing

### Phase 8: Cleanup & Documentation

#### 8.1 Remove Legacy Code
- Remove old column visibility logic
- Remove manual sorting implementation
- Clean up unused hooks
- Update imports

#### 8.2 Documentation
- Update component documentation
- Add usage examples
- Document new features
- Update README

## Expected Outcomes

### Immediate Benefits
- **Reduced Code Complexity**: Less manual state management
- **Better Performance**: Optimized rendering and state updates
- **Enhanced Features**: Multi-column sorting, advanced filtering
- **Improved TypeScript Support**: Better type safety and IntelliSense

### Long-term Benefits
- **Easier Maintenance**: Standardized patterns and APIs
- **Better Scalability**: Built-in virtualization and performance optimizations
- **Enhanced User Experience**: Better accessibility and responsive design
- **Future-proofing**: Active development and community support

## Risk Mitigation

### Potential Challenges
- **Learning Curve**: Team familiarization with TanStack Table APIs
- **Breaking Changes**: Potential compatibility issues with existing code
- **Performance Impact**: Initial performance impact during migration
- **Feature Parity**: Ensuring all existing features are maintained

### Mitigation Strategies
- **Gradual Migration**: Phase-by-phase implementation
- **Comprehensive Testing**: Extensive testing at each phase
- **Documentation**: Clear documentation and examples
- **Backup Plan**: Ability to rollback if needed

## Timeline

### Week 1-2: Foundation & Setup
- Dependencies installation
- Column definitions creation
- Base hook implementation
- TypeScript setup

### Week 3-4: Core Migration
- Component refactoring
- Basic feature implementation
- Testing setup
- Bug fixes

### Week 5-6: Enhancement & Integration
- Advanced features
- Context integration
- Performance optimization
- Comprehensive testing

### Week 7: Finalization
- Code cleanup
- Documentation
- Final testing
- Deployment preparation

## Success Metrics

### Performance Metrics
- **Render Time**: Improved table rendering performance
- **Memory Usage**: Reduced memory footprint
- **Bundle Size**: Optimized bundle size impact

### Feature Metrics
- **Feature Parity**: 100% feature parity with existing implementation
- **New Features**: Successfully implemented advanced features
- **User Experience**: Improved user interaction and accessibility

### Development Metrics
- **Code Quality**: Reduced complexity and improved maintainability
- **Test Coverage**: Comprehensive test coverage
- **Developer Experience**: Improved development workflow

## Conclusion

This migration to TanStack Table represents a significant improvement in the MediaTable implementation, providing better performance, enhanced features, and improved maintainability. The phased approach ensures minimal disruption while maximizing the benefits of the new architecture.

The investment in this migration will pay dividends in terms of reduced maintenance overhead, improved user experience, and better scalability for future enhancements.
