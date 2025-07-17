'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProgress, clearProgress } from '@/lib/actions/progress';

export function useProgress() {
  const queryClient = useQueryClient();

  // Query for progress data
  const { data, isLoading, error } = useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
    refetchInterval: 1000,
    staleTime: 0,
    gcTime: 0,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Clear progress function
  const handleClearProgress = async () => {
    await clearProgress();
    // Invalidate the progress query to refetch
    queryClient.invalidateQueries({ queryKey: ['progress'] });
  };

  return {
    state: data?.state,
    progress: data?.progress,
    isLoading,
    error,
    clearProgress: handleClearProgress,
  };
}
