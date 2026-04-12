import { type ElementType } from 'react';
import { TrendingDown, HardDrive, Film, Tv } from 'lucide-react';
import { MediaItem } from '@/lib/types/media';
import { formatFileSize } from '@/lib/utils/formatters';

interface MediaSummaryCardsProps {
  filteredItems: MediaItem[];
}

interface StatProps {
  label: string;
  value: string | number;
  icon: ElementType;
}

function Stat({ label, value, icon: Icon }: StatProps) {
  return (
    <div className='flex items-baseline gap-2'>
      <span className='text-2xl font-bold font-mono tracking-tight tabular-nums'>
        {value}
      </span>
      <span className='text-xs text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1'>
        <Icon className='size-3 shrink-0' />
        {label}
      </span>
    </div>
  );
}

export const MediaSummaryCards = ({
  filteredItems,
}: MediaSummaryCardsProps) => {
  const totalSize = filteredItems.reduce(
    (sum, item) => sum + (Number(item.sizeOnDisk) || 0),
    0
  );

  const movieCount = filteredItems.filter(
    (item) => item.type === 'movie'
  ).length;
  const tvCount = filteredItems.filter((item) => item.type === 'tv').length;

  return (
    <div className='flex flex-wrap items-center gap-x-8 gap-y-3 py-1 border-b border-border/50'>
      <Stat label='items' value={filteredItems.length} icon={TrendingDown} />
      <div className='w-px h-5 bg-border hidden sm:block' />
      <Stat label='storage' value={formatFileSize(totalSize)} icon={HardDrive} />
      <div className='w-px h-5 bg-border hidden sm:block' />
      <Stat label='movies' value={movieCount} icon={Film} />
      <div className='w-px h-5 bg-border hidden sm:block' />
      <Stat label='shows' value={tvCount} icon={Tv} />
    </div>
  );
};
