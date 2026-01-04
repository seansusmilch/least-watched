import { MediaStat } from './MediaStat';
import { Star, Clock, Eye } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatters';
import { formatRuntime } from '@/lib/utils/formatters';

interface MediaStatsProps {
  imdbRating?: number | null;
  tmdbRating?: number | null;
  runtime?: number | null;
  watchCount?: number;
  sizeOnDisk?: number | bigint | null;
}

export function MediaStats({
  imdbRating,
  tmdbRating,
  runtime,
  watchCount,
  sizeOnDisk,
}: MediaStatsProps) {
  return (
    <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
      {(imdbRating || tmdbRating) && (
        <MediaStat
          icon={
            <Star className='h-3 w-3 text-yellow-500 fill-yellow-500' />
          }
        >
          {imdbRating
            ? `${imdbRating.toFixed(1)} IMDb`
            : `${tmdbRating?.toFixed(1)} TMDb`}
        </MediaStat>
      )}
      {runtime && (
        <MediaStat icon={<Clock className='h-3 w-3' />}>
          {formatRuntime(runtime)}
        </MediaStat>
      )}
      {watchCount !== undefined && watchCount > 0 && (
        <MediaStat icon={<Eye className='h-3 w-3' />}>
          {watchCount} {watchCount === 1 ? 'play' : 'plays'}
        </MediaStat>
      )}
      {sizeOnDisk && (
        <MediaStat>{formatFileSize(sizeOnDisk)}</MediaStat>
      )}
    </div>
  );
}
