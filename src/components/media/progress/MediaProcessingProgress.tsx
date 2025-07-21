'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useProgress } from '@/hooks/use-progress';

interface MediaProcessingProgressProps {
  onClose?: () => void;
  onComplete?: () => void;
}

export function MediaProcessingProgress({
  onClose,
  onComplete,
}: MediaProcessingProgressProps) {
  const { state, progress, isLoading, error, clearProgress } = useProgress();

  // Handle completion
  if (state === 'completed' && onComplete) {
    onComplete();
  }

  // Don't render anything if no progress
  if (state === 'none' || (!progress && !isLoading)) {
    return null;
  }

  const handleClose = () => {
    if (state === 'completed') {
      clearProgress();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClearCompleted = async () => {
    await clearProgress();
  };

  const hasError = !!error;
  const progressPercentage = progress?.percentage || 0;

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            {hasError ? (
              <AlertCircle className='h-4 w-4 mr-2 text-destructive' />
            ) : state === 'completed' ? (
              <CheckCircle className='h-4 w-4 mr-2 text-green-500' />
            ) : (
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            )}
            {hasError
              ? 'Processing Error'
              : state === 'completed'
              ? 'Processing Complete!'
              : 'Processing Media...'}
          </CardTitle>
          <div className='flex items-center space-x-2'>
            {state === 'completed' && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleClearCompleted}
                className='h-8 px-3'
              >
                Clear
              </Button>
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
                {error?.message || 'An error occurred during processing'}
              </p>
            </div>
          )}

          {/* Progress Display */}
          {progress && !hasError && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label
                  className='text-sm font-medium'
                  data-testid='progress-message'
                >
                  {progress.phase || 'Processing media library...'}
                </Label>
                <div className='flex items-center space-x-2'>
                  {progress.total > 0 && (
                    <span className='text-sm text-muted-foreground'>
                      {progress.current}/{progress.total}
                    </span>
                  )}
                  <span
                    className='text-sm text-muted-foreground font-medium'
                    data-testid='progress-percentage'
                  >
                    {progressPercentage}%
                  </span>
                </div>
              </div>

              <Progress
                value={progressPercentage}
                className='w-full h-3'
                data-testid='progress-bar'
              />

              {progress.currentItem && (
                <p className='text-xs text-muted-foreground mt-2 truncate'>
                  Currently processing: {progress.currentItem}
                </p>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && !progress && (
            <div className='flex items-center justify-center py-8'>
              <RefreshCw className='h-6 w-6 animate-spin text-muted-foreground' />
              <span className='ml-2 text-sm text-muted-foreground'>
                Loading progress data...
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
