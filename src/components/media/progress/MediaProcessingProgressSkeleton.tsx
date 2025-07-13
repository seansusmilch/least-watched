import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function MediaProcessingProgressSkeleton() {
  return (
    <Card className='border-blue-200 bg-blue-50'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-blue-900'>
            <Skeleton className='h-6 w-40' />
          </CardTitle>
          <Button variant='ghost' size='sm' disabled>
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-12' />
          </div>
          <Skeleton className='h-2 w-full' />
        </div>

        <div className='space-y-1'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-3 w-36' />
        </div>
      </CardContent>
    </Card>
  );
}
