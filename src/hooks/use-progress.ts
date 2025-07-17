'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProgress, clearProgress } from '@/lib/actions/progress';

export function useProgress() {
  const queryClient = useQueryClient();

  // Query for progress data
  const { data, isLoading, error } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const progress = await getProgress();
      console.log(progress);
      return progress;
    },
    refetchInterval: ({ state }) => {
      switch (state.data?.state) {
        case 'none':
          return false;
        case 'live':
          return 500;
        case 'completed':
          return false;
        default:
          return 1000;
      }
    },
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
