import { Skeleton } from '@/components/ui/skeleton';

export function MediaSummaryCardsSkeleton() {
  return (
    <div className='flex flex-wrap items-center gap-x-8 gap-y-3 py-1 border-b border-border/50'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex items-baseline gap-2'>
          <Skeleton className='h-7 w-12' />
          <Skeleton className='h-3 w-20' />
        </div>
      ))}
    </div>
  );
}
