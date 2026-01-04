import { Calendar } from 'lucide-react';

interface TvShowInfoProps {
  seasonCount?: number | null;
  episodesOnDisk?: number | null;
}

export function TvShowInfo({ seasonCount, episodesOnDisk }: TvShowInfoProps) {
  if (!seasonCount) return null;

  return (
    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
      <Calendar className='h-3 w-3' />
      <span>
        {seasonCount} {seasonCount === 1 ? 'season' : 'seasons'}
        {episodesOnDisk && ` • ${episodesOnDisk} episodes`}
      </span>
    </div>
  );
}
