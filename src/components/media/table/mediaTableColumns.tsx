import { createColumnHelper } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MediaItem } from '@/lib/types/media';
import { formatDate, formatFileSize } from '@/lib/utils/formatters';
import { Film, Tv, Eye, Clock } from 'lucide-react';
import { MediaTitleHoverCard } from './MediaTitleHoverCard';
import { DeletionScoreBadge } from '../DeletionScoreBadge';

const columnHelper = createColumnHelper<MediaItem>();

export const createMediaTableColumns = (
  embyUrl?: string | null,
  embyApiKey?: string | null
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
    cell: ({ row }) => (
      <MediaTitleHoverCard
        item={row.original}
        embyUrl={embyUrl}
        embyApiKey={embyApiKey}
      />
    ),
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
  columnHelper.accessor('effectiveDateAdded', {
    id: 'dateAdded',
    header: 'Date Added',
    cell: ({ getValue }) => formatDate(getValue()),
    enableSorting: true,
    enableColumnFilter: true,
    size: 140,
  }),

  // Emby Date Added column (hidden by default via column config)
  columnHelper.accessor('dateAddedEmby', {
    id: 'dateAddedEmby',
    header: 'Emby Date Added',
    cell: ({ getValue }) => formatDate(getValue()),
    enableSorting: true,
    enableColumnFilter: true,
    size: 160,
  }),

  // ARR Date Added column (hidden by default via column config)
  columnHelper.accessor('dateAddedArr', {
    id: 'dateAddedArr',
    header: 'Arr Date Added',
    cell: ({ getValue }) => formatDate(getValue()),
    enableSorting: true,
    enableColumnFilter: true,
    size: 160,
  }),

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
      return (
        <DeletionScoreBadge
          score={score}
          onClick={() => {
            const event = new CustomEvent('openDeletionBreakdown', {
              detail: { item: row.original },
            });
            window.dispatchEvent(event);
          }}
        />
      );
    },
    enableSorting: true,
    enableColumnFilter: true,
    size: 160,
  }),
];
