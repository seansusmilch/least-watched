import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';

export function MediaProcessingProgressSkeleton() {
  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            <Skeleton className='h-6 w-40' />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-16' />
          </div>
          <Skeleton className='h-3 w-full' />
          <Skeleton className='h-3 w-48' />
          <div className='grid grid-cols-2 gap-4 pt-2 border-t'>
            <div className='text-center'>
              <Skeleton className='h-3 w-20 mx-auto mb-1' />
              <Skeleton className='h-4 w-8 mx-auto' />
            </div>
            <div className='text-center'>
              <Skeleton className='h-3 w-16 mx-auto mb-1' />
              <Skeleton className='h-4 w-8 mx-auto' />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
