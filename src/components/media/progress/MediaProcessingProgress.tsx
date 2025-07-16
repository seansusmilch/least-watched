'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, X, AlertCircle, Pause } from 'lucide-react';
import { useActionState, useOptimistic } from 'react';
import { toast } from 'sonner';
import {
  getProcessingProgress,
  getActiveMediaProcess,
  cancelMediaProcessing,
  revalidateAfterProcessing,
} from '@/lib/actions/media-processing';
import { type MediaProcessingProgress as MediaProcessingProgressType } from '@/lib/media-processor/';

interface MediaProcessingProgressProps {
  onClose?: () => void;
  onComplete?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface OptimisticState {
  progress: MediaProcessingProgressType | null;
  isLoading: boolean;
  error: string | null;
  isPaused: boolean;
}

export function MediaProcessingProgress({
  onClose,
  onComplete,
  autoRefresh = true,
  refreshInterval = 2000,
}: MediaProcessingProgressProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<MediaProcessingProgressType | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [hasCompleted, setHasCompleted] = useState(false);

  // Optimistic state for UI updates
  const [optimisticState, addOptimisticUpdate] = useOptimistic<
    OptimisticState,
    Partial<OptimisticState>
  >(
    {
      progress,
      isLoading,
      error,
      isPaused: false,
    },
    (state, newUpdate) => ({ ...state, ...newUpdate })
  );

  // Server action for cancelling processing
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelMediaProcessing,
    undefined
  );

  // Handle completion with router refresh and revalidation
  const handleComplete = useCallback(async () => {
    // Prevent multiple completion calls
    if (hasCompleted) return;

    setHasCompleted(true);

    // Show success message
    toast.success('Media processing completed successfully!');

    // Call custom completion handler if provided
    if (onComplete) {
      onComplete();
    }

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
  }, [router, hasCompleted, onComplete]);

  // Reset completion state on mount
  useEffect(() => {
    setHasCompleted(false);
  }, []);

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to get active process first
      const activeProcess = await getActiveMediaProcess();
      if (activeProcess) {
        setProgress(activeProcess);
        setLastUpdate(new Date());

        // Check if processing is complete
        if (activeProcess.phase === 'Complete') {
          handleComplete();
        }
        return;
      }

      // Fall back to getting current progress
      const progressData = await getProcessingProgress();
      if (progressData) {
        setProgress(progressData);
        setLastUpdate(new Date());

        // Check if processing is complete
        if (progressData.phase === 'Complete') {
          handleComplete();
        }
        return;
      }

      // No progress data found - clear progress to hide widget
      setProgress(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch progress';
      setError(errorMessage);
      console.error('Error fetching progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [handleComplete]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchProgress, refreshInterval);

    // Initial fetch
    fetchProgress();

    return () => clearInterval(interval);
  }, [fetchProgress, autoRefresh, refreshInterval]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    addOptimisticUpdate({ isLoading: true, error: null });
    fetchProgress();
  }, [fetchProgress, addOptimisticUpdate]);

  // Handle cancel processing
  const handleCancel = useCallback(() => {
    addOptimisticUpdate({ isPaused: true });

    const formData = new FormData();
    cancelAction(formData);
  }, [cancelAction, addOptimisticUpdate]);

  // Handle close
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Use optimistic state for rendering
  const currentProgress = optimisticState.progress || progress;
  const currentIsLoading = optimisticState.isLoading || isLoading;
  const currentError = optimisticState.error || error;
  const isPaused = optimisticState.isPaused;

  if (!currentProgress && !currentIsLoading && !currentError) {
    return null;
  }

  const isComplete = currentProgress?.phase === 'Complete';
  const hasError = !!currentError || !!cancelState?.errors;
  const progressPercentage = currentProgress?.percentage || 0;

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            {hasError ? (
              <AlertCircle className='h-4 w-4 mr-2 text-destructive' />
            ) : isComplete ? (
              <CheckCircle className='h-4 w-4 mr-2 text-green-500' />
            ) : isPaused ? (
              <Pause className='h-4 w-4 mr-2 text-yellow-500' />
            ) : (
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            )}
            {hasError
              ? 'Processing Error'
              : isComplete
              ? 'Processing Complete!'
              : isPaused
              ? 'Processing Paused'
              : 'Processing Media...'}
          </CardTitle>
          <div className='flex items-center space-x-2'>
            {!isComplete && !hasError && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRefresh}
                  disabled={currentIsLoading}
                  className='h-8 w-8 p-0'
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      currentIsLoading ? 'animate-spin' : ''
                    }`}
                  />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCancel}
                  disabled={cancelPending || isPaused}
                  className='h-8 px-3'
                >
                  {cancelPending ? (
                    <RefreshCw className='h-4 w-4 animate-spin' />
                  ) : (
                    'Cancel'
                  )}
                </Button>
              </>
            )}
            {onClose && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClose}
                className='h-8 w-8 p-0 hover:bg-muted'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Error Display */}
          {hasError && (
            <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
              <p className='text-sm text-destructive'>
                {currentError ||
                  cancelState?.message ||
                  'An error occurred during processing'}
              </p>
              {cancelState?.errors && (
                <ul className='mt-2 text-xs text-destructive/80'>
                  {Object.entries(cancelState.errors).map(([field, errors]) => (
                    <li key={field}>
                      {field}:{' '}
                      {Array.isArray(errors) ? errors.join(', ') : errors}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Progress Display */}
          {currentProgress && !hasError && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-sm font-medium'>
                  {currentProgress.phase || 'Processing media library...'}
                </Label>
                <div className='flex items-center space-x-2'>
                  {currentProgress.total > 0 && (
                    <span className='text-sm text-muted-foreground'>
                      {currentProgress.current}/{currentProgress.total}
                    </span>
                  )}
                  <span className='text-sm text-muted-foreground font-medium'>
                    {progressPercentage}%
                  </span>
                </div>
              </div>

              <Progress value={progressPercentage} className='w-full h-3' />

              {currentProgress.currentItem && (
                <p className='text-xs text-muted-foreground mt-2 truncate'>
                  Currently processing: {currentProgress.currentItem}
                </p>
              )}

              {/* Processing Stats */}
              <div className='grid grid-cols-2 gap-4 pt-2 border-t'>
                <div className='text-center'>
                  <p className='text-xs text-muted-foreground'>
                    Items Processed
                  </p>
                  <p className='text-sm font-medium'>
                    {currentProgress.current || 0}
                  </p>
                </div>
                <div className='text-center'>
                  <p className='text-xs text-muted-foreground'>Total Items</p>
                  <p className='text-sm font-medium'>
                    {currentProgress.total || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {currentIsLoading && !currentProgress && (
            <div className='flex items-center justify-center py-8'>
              <RefreshCw className='h-6 w-6 animate-spin text-muted-foreground' />
              <span className='ml-2 text-sm text-muted-foreground'>
                Loading progress data...
              </span>
            </div>
          )}

          {/* Last Update Time */}
          {lastUpdate && autoRefresh && (
            <div className='text-xs text-muted-foreground text-center pt-2 border-t'>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
