'use client';

import { useQuery } from '@tanstack/react-query';
import { getMediaItems } from '@/lib/actions/media-processing';
import { formatDateTime } from '@/lib/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';

export function LatestUpdateTimestamp() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-items'],
    queryFn: getMediaItems,
  });

  // Extract the latest updatedAt timestamp
  const latestUpdate =
    items.length > 0
      ? Math.max(...items.map((item) => new Date(item.updatedAt).getTime()))
      : null;

  if (isLoading) {
    return (
      <div className='flex items-center text-sm text-muted'>
        <Skeleton className='h-4 w-32' />
      </div>
    );
  }

  if (!latestUpdate) {
    return (
      <div className='flex items-center text-sm text-muted-foreground'>
        <span>Last updated: N/A</span>
      </div>
    );
  }

  return (
    <div className='flex items-center text-sm text-muted-foreground'>
      <span>Last updated: {formatDateTime(new Date(latestUpdate))}</span>
    </div>
  );
}
