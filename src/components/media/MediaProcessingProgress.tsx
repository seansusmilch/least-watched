import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { ProcessingProgress } from '@/lib/types/media';

interface MediaProcessingProgressProps {
  progress: ProcessingProgress;
}

export const MediaProcessingProgress = ({
  progress,
}: MediaProcessingProgressProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
          Processing...
        </CardTitle>
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
