import { useState, useEffect } from 'react';
import { ProcessingProgress } from '@/lib/types/media';
import {
  startMediaProcessing,
  getProcessingProgress,
  getActiveMediaProcess,
} from '@/lib/actions/media-processing';

export const useMediaProcessing = (onComplete?: () => void) => {
  const [processing, setProcessing] = useState(false);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    processProgress: 0,
    progressPhase: '',
    progressCurrentItem: '',
    progressCurrent: 0,
    progressTotal: 0,
  });

  // Check for active process on mount
  useEffect(() => {
    const checkActiveProcess = async () => {
      try {
        const activeProcess = await getActiveMediaProcess();
        if (activeProcess) {
          console.log('Found active media process:', activeProcess);
          setProgressId(activeProcess.progressId);
          setProcessing(true);
          setProgress({
            processProgress: activeProcess.progress.percentage,
            progressPhase: activeProcess.progress.phase,
            progressCurrentItem: activeProcess.progress.currentItem,
            progressCurrent: activeProcess.progress.current,
            progressTotal: activeProcess.progress.total,
          });
        }
      } catch (error) {
        console.error('Error checking for active process:', error);
      }
    };

    checkActiveProcess();
  }, []); // Run only on mount

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
              setIsCompleted(true);

              // Update progress to show completion
              setProgress({
                processProgress: 100,
                progressPhase: 'Complete',
                progressCurrentItem:
                  progressData.currentItem ||
                  'Processing completed successfully!',
                progressCurrent: progressData.total,
                progressTotal: progressData.total,
              });

              setProgressId(null);

              if (progressData.error) {
                console.error('Processing failed:', progressData.error);
              } else {
                console.log('Media processing completed successfully!');
              }

              // Call onComplete callback immediately when processing finishes
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
    setIsCompleted(false);
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
    setIsCompleted(false);
    setProgress({
      processProgress: 0,
      progressPhase: '',
      progressCurrentItem: '',
      progressCurrent: 0,
      progressTotal: 0,
    });
    setProgressId(null);
  };

  const closeProgress = () => {
    setIsCompleted(false);
    setProgress({
      processProgress: 0,
      progressPhase: '',
      progressCurrentItem: '',
      progressCurrent: 0,
      progressTotal: 0,
    });
  };

  return {
    processing: processing || isCompleted, // Show progress component during processing or completion
    progress,
    startProcessing,
    resetProcessing,
    closeProgress,
  };
};
