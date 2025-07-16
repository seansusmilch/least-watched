import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FolderOpen } from 'lucide-react';

export function FolderSpaceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <FolderOpen className='h-5 w-5' />
          <span>Selected Folders Space</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-row gap-4 overflow-x-auto flex-nowrap pb-2'>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card
              key={idx}
              className='cursor-pointer flex-shrink-0 w-80 hover:bg-muted relative'
            >
              <CardHeader className='flex items-center justify-between px-4'>
                {/* Header skeleton: icon and title */}
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-1/2' />
              </CardHeader>
              <CardContent className='px-4'>
                {/* Progress bar skeleton */}
                <Skeleton className='h-2 w-full mb-4' />
                {/* Grid of space details skeleton */}
                <div className='grid grid-cols-3 gap-4 mb-4'>
                  <Skeleton className='h-6 w-full' />
                  <Skeleton className='h-6 w-full' />
                  <Skeleton className='h-6 w-full' />
                </div>
                {/* Metadata skeleton */}
                <div className='flex items-center space-x-4'>
                  <Skeleton className='h-3 w-1/3' />
                  <Skeleton className='h-3 w-1/4' />
                  <Skeleton className='h-3 w-1/5' />
                </div>
                <Badge variant='outline' className='text-xs'></Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
