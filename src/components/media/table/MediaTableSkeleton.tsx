import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Columns } from 'lucide-react';

export function MediaTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Skeleton className='h-5 w-5' />
            <Skeleton className='h-6 w-32' />
          </CardTitle>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' disabled>
              <Columns className='h-4 w-4' />
              Columns
            </Button>
            <Skeleton className='h-9 w-20' />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Table Header */}
          <div className='grid grid-cols-8 gap-4 pb-2 border-b'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-20' />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='grid grid-cols-8 gap-4 py-2'>
              <Skeleton className='h-4 w-4' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-32' />
              </div>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-4 w-16' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
