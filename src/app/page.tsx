import { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout';
import {
  MediaTableSkeleton,
  MediaSummaryCardsSkeleton,
  MediaProcessingProgressSkeleton,
  MediaProcessingProgress,
  MediaSummaryCardsServer,
  PageActions,
  MediaPageServer,
} from '@/components/media';
import {
  FolderSpaceSkeleton,
  FolderSpaceWidgetWithInitialData,
} from '@/components/folder-space';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';

export default function LeastWatchedPage() {
  return (
    <AppLayout>
      <div className='space-y-6'>
        {/* Static Page Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Least Watched</h1>
            <p className='text-muted-foreground'>
              Identify and manage your unwatched media content
            </p>
          </div>
          {/* Dynamic Page Actions - Now client-side */}
          <PageActions />
        </div>

        {/* Dynamic Processing Progress - Now client-side */}
        <Suspense fallback={<MediaProcessingProgressSkeleton />}>
          <MediaProcessingProgress />
        </Suspense>

        {/* Dynamic Folder Space Widget - Streamed */}
        <Suspense fallback={<FolderSpaceSkeleton />}>
          <FolderSpaceWidgetWithInitialData />
        </Suspense>

        {/* Dynamic Summary Cards - Streamed */}
        <Suspense fallback={<MediaSummaryCardsSkeleton />}>
          <MediaSummaryCardsServer />
        </Suspense>

        {/* Dynamic Media Page (Filters + Table) - Streamed */}
        <Suspense
          fallback={
            <div className='space-y-6'>
              <div className='h-32 bg-muted animate-pulse rounded' />
              <MediaTableSkeleton />
            </div>
          }
        >
          <MediaPageServer />
        </Suspense>
      </div>
    </AppLayout>
  );
}
