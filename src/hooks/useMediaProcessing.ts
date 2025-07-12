import { useState, useEffect } from 'react';
import { ProcessingProgress } from '@/lib/types/media';
import {
  startMediaProcessing,
  getProcessingProgress,
} from '@/lib/actions/media-processing';

export const useMediaProcessing = (onComplete?: () => void) => {
  const [processing, setProcessing] = useState(false);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress>({
    processProgress: 0,
    progressPhase: '',
    progressCurrentItem: '',
    progressCurrent: 0,
    progressTotal: 0,
  });

  // Progress polling effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (processing && progressId) {
      interval = setInterval(async () => {
        try {
          const progressData = await getProcessingProgress(progressId);
          if (progressData) {
            setProgress({
              processProgress: progressData.percentage,
              progressPhase: progressData.phase,
              progressCurrentItem: progressData.currentItem,
              progressCurrent: progressData.current,
              progressTotal: progressData.total,
            });

            // Check if processing is complete
            if (progressData.isComplete || progressData.percentage >= 100) {
              setProcessing(false);
              setProgress({
                processProgress: 0,
                progressPhase: '',
                progressCurrentItem: '',
                progressCurrent: 0,
                progressTotal: 0,
              });
              setProgressId(null);

              if (progressData.error) {
                console.error('Processing failed:', progressData.error);
              } else {
                console.log('Media processing completed successfully!');
              }

              onComplete?.();
            }
          }
        } catch (error) {
          console.error('Error fetching progress:', error);
        }
      }, 500); // Poll every 500ms
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [processing, progressId, onComplete]);

  const startProcessing = async () => {
    setProcessing(true);
    setProgress({
      processProgress: 0,
      progressPhase: 'Initializing...',
      progressCurrentItem: '',
      progressCurrent: 0,
      progressTotal: 0,
    });

    try {
      const result = await startMediaProcessing();
      if (result.success) {
        setProgressId(result.progressId);
        // Processing will continue in background, polling will track progress
      } else {
        console.error('Error starting media processing:', result.error);
        resetProcessing();
      }
    } catch (error) {
      console.error('Error starting media processing:', error);
      resetProcessing();
    }
  };

  const resetProcessing = () => {
    setProcessing(false);
    setProgress({
      processProgress: 0,
      progressPhase: '',
      progressCurrentItem: '',
      progressCurrent: 0,
      progressTotal: 0,
    });
    setProgressId(null);
  };

  return {
    processing,
    progress,
    startProcessing,
    resetProcessing,
  };
};
