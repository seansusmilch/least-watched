import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Film, Tv, Eye, Clock, SortAsc, SortDesc, Columns } from 'lucide-react';
import { MediaItem, SortCriteria } from '@/lib/types/media';
import { formatDate, formatFileSize } from '@/lib/utils/formatters';
import { availableColumns } from '@/lib/utils/columnConfig';
import { DeletionScoreBreakdown } from './DeletionScoreBreakdown';

interface MediaTableProps {
  items: MediaItem[];
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: () => void;
  selectedItems: Set<string>;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  sortCriteria: SortCriteria;
  onSort: (field: keyof MediaItem) => void;
  hasUnsavedChanges: () => boolean;
  tempColumnVisibility: Record<string, boolean>;
  onTempColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  onSaveColumnVisibility: () => void;
  onResetColumnVisibility: () => void;
  isColumnPopoverOpen: boolean;
  setIsColumnPopoverOpen: (open: boolean) => void;
}

export const MediaTable = ({
  items,
  columnVisibility,
  onColumnVisibilityChange,
  selectedItems,
  onSelectionChange,
  onSelectAll,
  sortCriteria,
  onSort,
  hasUnsavedChanges,
  tempColumnVisibility,
  onTempColumnVisibilityChange,
  onSaveColumnVisibility,
  onResetColumnVisibility,
  isColumnPopoverOpen,
  setIsColumnPopoverOpen,
}: MediaTableProps) => {
  const [breakdownItem, setBreakdownItem] = useState<MediaItem | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getSortIcon = (field: keyof MediaItem) => {
    if (sortCriteria.field === field) {
      return sortCriteria.order === 'asc' ? (
        <SortAsc className='h-4 w-4 ml-1' />
      ) : (
        <SortDesc className='h-4 w-4 ml-1' />
      );
    }
    return null;
  };

  const selectedSize = Array.from(selectedItems).reduce((sum, id) => {
    const item = items.find((m) => m.id === id);
    return sum + (item?.sizeOnDisk || 0);
  }, 0);

  const handleOpenColumnPopover = () => {
    onColumnVisibilityChange();
    setIsColumnPopoverOpen(true);
  };

  const handleOpenBreakdown = (item: MediaItem) => {
    setBreakdownItem(item);
    setShowBreakdown(true);
  };

  const handleCloseBreakdown = () => {
    setShowBreakdown(false);
    setBreakdownItem(null);
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
            {selectedItems.size > 0 && (
              <Badge variant='secondary'>
                {selectedItems.size} selected ({formatFileSize(selectedSize)})
              </Badge>
            )}
            {/* Column Selection Dropdown */}
            <Popover
              open={isColumnPopoverOpen}
              onOpenChange={setIsColumnPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleOpenColumnPopover}
                >
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
                  {availableColumns.map((column) => (
                    <div key={column.id} className='flex items-center'>
                      <Checkbox
                        id={`column-${column.id}`}
                        checked={tempColumnVisibility[column.id]}
                        onCheckedChange={(checked) =>
                          onTempColumnVisibilityChange(
                            column.id,
                            checked as boolean
                          )
                        }
                      />
                      <Label htmlFor={`column-${column.id}`} className='ml-2'>
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {hasUnsavedChanges() && (
                  <div className='text-xs text-muted-foreground mt-2 mb-1'>
                    ⚠️ You have unsaved changes
                  </div>
                )}
                <div className='flex justify-end space-x-2 mt-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onResetColumnVisibility}
                  >
                    Reset
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsColumnPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button size='sm' onClick={onSaveColumnVisibility}>
                    Save
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[50px]'>
                  <Checkbox
                    checked={
                      items.length > 0 && selectedItems.size === items.length
                    }
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                {columnVisibility.title && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('title')}
                  >
                    <div className='flex items-center'>
                      Title
                      {getSortIcon('title')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.type && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('type')}
                  >
                    <div className='flex items-center'>
                      Type
                      {getSortIcon('type')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.year && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('year')}
                  >
                    <div className='flex items-center'>
                      Year
                      {getSortIcon('year')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.size && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('sizeOnDisk')}
                  >
                    <div className='flex items-center'>
                      Size
                      {getSortIcon('sizeOnDisk')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.quality && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('qualityScore')}
                  >
                    <div className='flex items-center'>
                      Quality
                      {getSortIcon('qualityScore')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.completion && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('completionPercentage')}
                  >
                    <div className='flex items-center'>
                      Completion
                      {getSortIcon('completionPercentage')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.rating && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('imdbRating')}
                  >
                    <div className='flex items-center'>
                      Rating
                      {getSortIcon('imdbRating')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.source && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('source')}
                  >
                    <div className='flex items-center'>
                      Source
                      {getSortIcon('source')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.folder && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('parentFolder')}
                  >
                    <div className='flex items-center'>
                      Folder
                      {getSortIcon('parentFolder')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.dateAdded && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('dateAdded')}
                  >
                    <div className='flex items-center'>
                      Date Added
                      {getSortIcon('dateAdded')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.lastWatched && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('lastWatched')}
                  >
                    <div className='flex items-center'>
                      Last Watched
                      {getSortIcon('lastWatched')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.unwatchedDays && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('unwatchedDays')}
                  >
                    <div className='flex items-center'>
                      Days Unwatched
                      {getSortIcon('unwatchedDays')}
                    </div>
                  </TableHead>
                )}
                {columnVisibility.deletionScore && (
                  <TableHead
                    className='cursor-pointer select-none hover:bg-muted/50'
                    onClick={() => onSort('deletionScore')}
                  >
                    <div className='flex items-center'>
                      Deletion Score
                      {getSortIcon('deletionScore')}
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) =>
                        onSelectionChange(item.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  {columnVisibility.title && (
                    <TableCell className='font-medium'>{item.title}</TableCell>
                  )}
                  {columnVisibility.type && (
                    <TableCell>
                      <Badge
                        variant={
                          item.type === 'movie' ? 'default' : 'secondary'
                        }
                      >
                        {item.type === 'movie' ? (
                          <>
                            <Film className='h-3 w-3 mr-1' /> Movie
                          </>
                        ) : (
                          <>
                            <Tv className='h-3 w-3 mr-1' /> TV
                          </>
                        )}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.year && (
                    <TableCell>{item.year || 'N/A'}</TableCell>
                  )}
                  {columnVisibility.size && (
                    <TableCell>
                      {formatFileSize(item.sizeOnDisk || 0)}
                    </TableCell>
                  )}
                  {columnVisibility.quality && (
                    <TableCell>
                      {item.quality ? (
                        <Badge
                          variant={
                            (item.qualityScore || 0) > 80
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {item.quality}
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground'>Unknown</span>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.completion && (
                    <TableCell>
                      {item.type === 'tv' &&
                      item.completionPercentage !== undefined ? (
                        <div className='flex items-center gap-2'>
                          <Progress
                            value={item.completionPercentage}
                            className='w-16 h-2'
                          />
                          <span className='text-sm min-w-[60px]'>
                            {item.completionPercentage}%
                          </span>
                        </div>
                      ) : item.type === 'movie' ? (
                        <Badge
                          variant={item.fullyWatched ? 'default' : 'secondary'}
                        >
                          {item.fullyWatched ? 'Complete' : 'Unwatched'}
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground'>N/A</span>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.rating && (
                    <TableCell>
                      {item.imdbRating ? (
                        <div className='flex items-center gap-1'>
                          <span className='text-yellow-500'>⭐</span>
                          <span className='text-sm font-medium'>
                            {item.imdbRating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>N/A</span>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.source && (
                    <TableCell>
                      <Badge variant='outline'>
                        {item.source || 'Unknown'}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.folder && (
                    <TableCell>
                      <Badge variant='outline'>
                        {item.parentFolder || 'N/A'}
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.dateAdded && (
                    <TableCell>{formatDate(item.dateAdded)}</TableCell>
                  )}
                  {columnVisibility.lastWatched && (
                    <TableCell>
                      {item.lastWatched ? (
                        <span className='flex items-center'>
                          <Eye className='h-3 w-3 mr-1' />
                          {formatDate(item.lastWatched)}
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>Never</span>
                      )}
                    </TableCell>
                  )}
                  {columnVisibility.unwatchedDays && (
                    <TableCell>
                      <Badge
                        variant={
                          item.unwatchedDays > 365 ? 'destructive' : 'secondary'
                        }
                      >
                        <Clock className='h-3 w-3 mr-1' />
                        {item.unwatchedDays}d
                      </Badge>
                    </TableCell>
                  )}
                  {columnVisibility.deletionScore && (
                    <TableCell>
                      {item.deletionScore !== undefined ? (
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant={
                              item.deletionScore > 70
                                ? 'destructive'
                                : item.deletionScore > 40
                                ? 'secondary'
                                : 'outline'
                            }
                            className='cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() => handleOpenBreakdown(item)}
                          >
                            {item.deletionScore}
                          </Badge>
                          {item.deletionScore > 70 && (
                            <span className='text-xs text-destructive font-medium'>
                              High Priority
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>N/A</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {breakdownItem && (
        <DeletionScoreBreakdown
          item={breakdownItem}
          open={showBreakdown}
          onClose={handleCloseBreakdown}
        />
      )}
    </Card>
  );
};
