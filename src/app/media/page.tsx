import { Suspense } from 'react';
import { AppLayout } from '@/components/app-layout';
import { MediaTableSkeleton } from '@/components/media';
import { MediaPageClient } from '@/components/media/MediaPageClient';

export const dynamic = 'force-dynamic';

export default function MediaPage() {
  return (
    <AppLayout>
      <div className='h-[calc(100vh-5rem)] flex flex-col'>
        <Suspense fallback={<MediaTableSkeleton />}>
          <MediaPageClient fullscreen />
        </Suspense>
      </div>
    </AppLayout>
  );
}
