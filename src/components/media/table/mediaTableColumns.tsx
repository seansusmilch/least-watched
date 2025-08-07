import { createColumnHelper } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MediaItem, getEffectiveDateAdded } from '@/lib/types/media';
import { formatDate, formatFileSize } from '@/lib/utils/formatters';
import { Film, Tv, Eye, Clock } from 'lucide-react';

const columnHelper = createColumnHelper<MediaItem>();

export const createMediaTableColumns = (
  preferEmbyDateAdded: boolean = false
) => [
  // Selection column
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllRowsSelected() ||
          (table.getIsSomeRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 60,
  }),

  // Title column
  columnHelper.accessor('title', {
    header: 'Title',
    cell: ({ getValue }) => <div className='truncate'>{getValue()}</div>,
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'includesString',
    size: 350,
  }),

  // Type column
  columnHelper.accessor('type', {
    header: 'Type',
    cell: ({ getValue }) => {
      const type = getValue();
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
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: 'equals',
    size: 120,
  }),

  // Year column
  columnHelper.accessor('year', {
    header: 'Year',
    cell: ({ getValue }) => getValue() || 'N/A',
    enableSorting: true,
    enableColumnFilter: true,
    size: 80,
  }),

  // Size column
  columnHelper.accessor('sizeOnDisk', {
    id: 'size',
    header: 'Size',
    cell: ({ getValue }) => formatFileSize(Number(getValue()) || 0),
    enableSorting: true,
    enableColumnFilter: true,
    size: 120,
  }),

  // Quality column
  columnHelper.accessor('quality', {
    header: 'Quality',
    cell: ({ getValue, row }) => {
      const quality = getValue();
      const qualityScore = row.original.qualityScore || 0;

      if (quality) {
        return (
          <Badge variant={qualityScore > 80 ? 'default' : 'secondary'}>
            {quality}
          </Badge>
        );
      }
      return <span className='text-muted-foreground'>Unknown</span>;
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 120,
  }),

  // Completion column
  columnHelper.accessor('completionPercentage', {
    id: 'completion',
    header: 'Completion',
    cell: ({ getValue, row }) => {
      const completion = getValue();
      const type = row.original.type;
      const fullyWatched = row.original.fullyWatched;

      if (type === 'tv' && completion !== undefined) {
        return (
          <div className='flex items-center gap-2'>
            <Progress value={completion} className='w-16 h-2' />
            <span className='text-sm min-w-[60px]'>{completion}%</span>
          </div>
        );
      } else if (type === 'movie') {
        return (
          <Badge variant={fullyWatched ? 'default' : 'secondary'}>
            {fullyWatched ? 'Complete' : 'Unwatched'}
          </Badge>
        );
      }
      return <span className='text-muted-foreground'>N/A</span>;
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 150,
  }),

  // Rating column
  columnHelper.accessor('imdbRating', {
    id: 'rating',
    header: 'Rating',
    cell: ({ getValue }) => {
      const rating = getValue();
      if (rating) {
        return (
          <div className='flex items-center gap-1'>
            <span className='text-yellow-500'>⭐</span>
            <span className='text-sm font-medium'>{rating.toFixed(1)}</span>
          </div>
        );
      }
      return <span className='text-muted-foreground'>N/A</span>;
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 100,
  }),

  // Source column
  columnHelper.accessor('source', {
    header: 'Source',
    cell: ({ getValue }) => (
      <Badge variant='outline'>{getValue() || 'Unknown'}</Badge>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 120,
  }),

  // Folder column
  columnHelper.accessor('parentFolder', {
    id: 'folder',
    header: 'Folder',
    cell: ({ getValue }) => (
      <Badge variant='outline'>{getValue() || 'N/A'}</Badge>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    size: 200,
  }),

  // Date Added column
  columnHelper.accessor(
    (row) => getEffectiveDateAdded(row, preferEmbyDateAdded),
    {
      id: 'dateAdded',
      header: 'Date Added',
      cell: ({ getValue }) => formatDate(getValue()),
      enableSorting: true,
      enableColumnFilter: true,
      size: 140,
    }
  ),

  // Last Watched column
  columnHelper.accessor('lastWatched', {
    header: 'Last Watched',
    cell: ({ getValue }) => {
      const lastWatched = getValue();
      if (lastWatched) {
        return (
          <span className='flex items-center'>
            <Eye className='h-3 w-3 mr-1' />
            {formatDate(lastWatched)}
          </span>
        );
      }
      return <span className='text-muted-foreground'>Never</span>;
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 150,
  }),

  // Unwatched Days column
  columnHelper.accessor('unwatchedDays', {
    header: 'Days Unwatched',
    cell: ({ getValue }) => {
      const days = getValue();
      return (
        <Badge
          variant={
            days > 365 ? 'destructive' : days > 30 ? 'secondary' : 'outline'
          }
        >
          <Clock className='h-3 w-3 mr-1' />
          {days}d
        </Badge>
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 160,
  }),

  // Deletion Score column
  columnHelper.accessor('deletionScore', {
    header: 'Deletion Score',
    cell: ({ getValue, row }) => {
      const score = getValue();
      if (score !== undefined && score !== null) {
        return (
          <div className='flex items-center gap-2'>
            <Badge
              variant={
                score > 70
                  ? 'destructive'
                  : score > 40
                  ? 'secondary'
                  : 'outline'
              }
              className='cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => {
                // This will be handled by the parent component
                const event = new CustomEvent('openDeletionBreakdown', {
                  detail: { item: row.original },
                });
                window.dispatchEvent(event);
              }}
            >
              {score}
            </Badge>
            {score > 70 && (
              <span className='text-xs text-destructive font-medium'>
                High Priority
              </span>
            )}
          </div>
        );
      }
      return <span className='text-muted-foreground'>N/A</span>;
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 160,
  }),
];
