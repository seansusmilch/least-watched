import { type ElementType } from 'react';
import { TrendingDown, HardDrive, Film, Tv } from 'lucide-react';
import { MediaItem } from '@/lib/types/media';
import { formatFileSize } from '@/lib/utils/formatters';

interface MediaSummaryCardsProps {
  filteredItems: MediaItem[];
  totalItems: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: ElementType;
  accentClass: string;
  iconClass: string;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentClass,
  iconClass,
}: StatCardProps) {
  return (
    <div className='relative overflow-hidden rounded-lg border bg-card p-5 flex flex-col gap-3 shadow-sm'>
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${accentClass}`} />

      <div className='flex items-start justify-between'>
        <p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
          {label}
        </p>
        <div
          className={`flex size-8 items-center justify-center rounded-md ${iconClass}`}
        >
          <Icon className='size-4' />
        </div>
      </div>

      <div>
        <p className='text-3xl font-bold tracking-tight font-mono leading-none'>
          {value}
        </p>
        <p className='mt-1.5 text-xs text-muted-foreground'>{sub}</p>
      </div>
    </div>
  );
}

export const MediaSummaryCards = ({
  filteredItems,
  totalItems,
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
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <StatCard
        label='Total Items'
        value={filteredItems.length}
        sub={`of ${totalItems} total in library`}
        icon={TrendingDown}
        accentClass='bg-primary'
        iconClass='bg-primary/10 text-primary'
      />
      <StatCard
        label='Storage Impact'
        value={formatFileSize(totalSize)}
        sub='Space used by filtered items'
        icon={HardDrive}
        accentClass='bg-chart-2'
        iconClass='bg-chart-2/10 text-chart-2'
      />
      <StatCard
        label='Movies'
        value={movieCount}
        sub='Least-watched films'
        icon={Film}
        accentClass='bg-chart-3'
        iconClass='bg-chart-3/10 text-chart-3'
      />
      <StatCard
        label='TV Shows'
        value={tvCount}
        sub='Least-watched series'
        icon={Tv}
        accentClass='bg-chart-5'
        iconClass='bg-chart-5/10 text-chart-5'
      />
    </div>
  );
};
