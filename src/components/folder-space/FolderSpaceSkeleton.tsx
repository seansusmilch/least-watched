import { Skeleton } from '@/components/ui/skeleton';

export function FolderSpaceSkeleton() {
  return (
    <div className='py-3 border-b border-border/50'>
      <Skeleton className='h-3 w-20 mb-3' />
      <div className='flex flex-col divide-y divide-border/40'>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className='py-2.5 flex flex-col gap-2'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-3 w-3' />
              <Skeleton className='h-3 w-48' />
              <Skeleton className='h-4 w-16 ml-auto' />
            </div>
            <Skeleton className='h-1 w-full' />
          </div>
        ))}
      </div>
    </div>
  );
}
