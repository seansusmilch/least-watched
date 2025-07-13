import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MediaSummaryCardsSkeleton() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              <Skeleton className='h-4 w-24' />
            </CardTitle>
            <Skeleton className='h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-3 w-32' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
