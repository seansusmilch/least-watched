import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, X } from 'lucide-react';
import { ProcessingProgress } from '@/lib/types/media';

interface MediaProcessingProgressProps {
  progress: ProcessingProgress;
  onClose?: () => void;
}

export const MediaProcessingProgress = ({
  progress,
  onClose,
}: MediaProcessingProgressProps) => {
  const isComplete = progress.progressPhase === 'Complete';

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            {isComplete ? (
              <CheckCircle className='h-4 w-4 mr-2 text-green-500' />
            ) : (
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            )}
            {isComplete ? 'Processing Complete!' : 'Processing...'}
          </CardTitle>
          {onClose && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='h-6 w-6 p-0 hover:bg-muted'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label>
              {progress.progressPhase || 'Processing media library...'}
            </Label>
            <div className='flex items-center space-x-2'>
              {progress.progressTotal > 0 && (
                <span className='text-sm text-muted-foreground'>
                  {progress.progressCurrent}/{progress.progressTotal}
                </span>
              )}
              <span className='text-sm text-muted-foreground'>
                {progress.processProgress}%
              </span>
            </div>
          </div>
          <Progress value={progress.processProgress} className='w-full' />
          {progress.progressCurrentItem && (
            <p className='text-xs text-muted-foreground mt-1'>
              {progress.progressCurrentItem}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
