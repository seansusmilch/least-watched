'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MediaProcessingProgressClient } from './MediaProcessingProgressClient';
import { revalidateAfterProcessing } from '@/lib/actions/media-processing';
import { toast } from 'sonner';

interface MediaProcessingProgressWrapperProps {
  initialProgressId?: string;
}

export function MediaProcessingProgressWrapper({
  initialProgressId,
}: MediaProcessingProgressWrapperProps) {
  const router = useRouter();
  const [hasCompleted, setHasCompleted] = useState(false);

  const handleComplete = useCallback(async () => {
    // Prevent multiple completion calls
    if (hasCompleted) return;

    setHasCompleted(true);

    // Show success message
    toast.success('Media processing completed successfully!');

    try {
      // First, trigger server-side revalidation
      await revalidateAfterProcessing();

      // Then refresh the router to update components
      router.refresh();
    } catch (error) {
      console.error('Failed to refresh after processing:', error);
      // Fallback to just router refresh
      router.refresh();
    }
  }, [router, hasCompleted]);

  // Reset completion state when progressId changes
  useEffect(() => {
    if (initialProgressId) {
      setHasCompleted(false);
    }
  }, [initialProgressId]);

  return (
    <MediaProcessingProgressClient
      initialProgressId={initialProgressId}
      autoRefresh={true}
      refreshInterval={3000}
      onComplete={handleComplete}
    />
  );
}
