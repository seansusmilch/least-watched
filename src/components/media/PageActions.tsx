'use client';

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  startMediaProcessing,
  refreshMediaItems,
  refreshFolderSpaceData,
} from '@/lib/actions/media-processing';
import { useProgress } from '@/hooks/use-progress';
import { LatestUpdateTimestamp } from './LatestUpdateTimestamp';

interface PageActionsProps {
  onRefreshComplete?: () => void;
  disabled?: boolean;
}

export function PageActions({
  onRefreshComplete,
  disabled = false,
}: PageActionsProps) {
  const { state: progressState } = useProgress();
  const queryClient = useQueryClient();

  // Check if there's an active process
  const hasActiveProcess = progressState === 'live';

  // Process Media Mutation
  const processMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      return startMediaProcessing(undefined, formData);
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ['progress'] });
      } else {
        throw new Error(result?.message || 'Failed to start media processing');
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to start media processing';
      toast.error(errorMessage);
    },
  });

  // Refresh Data Mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      // Call both refresh actions in parallel
      const [refreshResult] = await Promise.all([
        refreshMediaItems(undefined, formData),
        refreshFolderSpaceData(undefined, formData),
      ]);

      return refreshResult;
    },
    onSuccess: (result) => {
      if (result?.success) {
        onRefreshComplete?.();
      } else {
        throw new Error(result?.message || 'Failed to refresh data');
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to refresh data';
      toast.error(errorMessage);
    },
  });

  // Handle functions
  const handleProcess = useCallback(() => {
    processMutation.mutate();
  }, [processMutation]);

  const handleRefresh = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  // Disable actions if there's an active process or if explicitly disabled
  const shouldDisable = disabled || hasActiveProcess;

  // Check if any mutation has an error
  const hasError = processMutation.isError || refreshMutation.isError;

  return (
    <div className='flex items-center space-x-2'>
      {/* Latest Update Timestamp */}
      <LatestUpdateTimestamp />

      {/* Process Media Button */}
      <Button
        data-testid='process-media-button'
        onClick={handleProcess}
        disabled={
          shouldDisable ||
          processMutation.isPending ||
          refreshMutation.isPending
        }
        size='sm'
        className='relative'
      >
        {processMutation.isPending || hasActiveProcess ? (
          <>
            <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            Processing...
          </>
        ) : (
          <>
            <Play className='h-4 w-4 mr-2' />
            Process Media
          </>
        )}
      </Button>

      {/* Refresh Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={handleRefresh}
        disabled={
          shouldDisable ||
          refreshMutation.isPending ||
          processMutation.isPending
        }
        className='relative'
      >
        {refreshMutation.isPending ? (
          <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
        ) : (
          <RefreshCw className='h-4 w-4 mr-2' />
        )}
        Refresh
      </Button>

      {/* Error Indicator */}
      {hasError && (
        <div className='flex items-center text-destructive'>
          <AlertCircle className='h-4 w-4 mr-1' />
          <span className='text-xs'>Action failed</span>
        </div>
      )}
    </div>
  );
}
