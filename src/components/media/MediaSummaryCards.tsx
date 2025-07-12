import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, HardDrive, Film, Tv } from 'lucide-react';
import { MediaItem } from '@/lib/types/media';
import { formatFileSize } from '@/lib/utils/formatters';

interface MediaSummaryCardsProps {
  filteredItems: MediaItem[];
  totalItems: number;
}

export const MediaSummaryCards = ({
  filteredItems,
  totalItems,
}: MediaSummaryCardsProps) => {
  const totalSize = filteredItems.reduce(
    (sum, item) => sum + (item.sizeOnDisk || 0),
    0
  );

  const movieCount = filteredItems.filter(
    (item) => item.type === 'movie'
  ).length;
  const tvCount = filteredItems.filter((item) => item.type === 'tv').length;

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Items</CardTitle>
          <TrendingDown className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{filteredItems.length}</div>
          <p className='text-xs text-muted-foreground'>
            {totalItems} total items
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Storage Impact</CardTitle>
          <HardDrive className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{formatFileSize(totalSize)}</div>
          <p className='text-xs text-muted-foreground'>
            Space used by filtered items
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Movies</CardTitle>
          <Film className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{movieCount}</div>
          <p className='text-xs text-muted-foreground'>Unwatched movies</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>TV Shows</CardTitle>
          <Tv className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{tvCount}</div>
          <p className='text-xs text-muted-foreground'>Unwatched TV content</p>
        </CardContent>
      </Card>
    </div>
  );
};
