import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDatePreference,
  updateDatePreference,
} from '@/lib/actions/settings/app-settings';
import { clearMediaItems } from '@/lib/actions/media-processing';
import type { DatePreference } from '@/lib/types/media';

export function useAdvancedSettings() {
  const queryClient = useQueryClient();

  // Query: Fetch date preference setting
  const datePreferenceQuery = useQuery<DatePreference>({
    queryKey: ['date-preference'],
    queryFn: getDatePreference,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Mutation: Update date preference
  const updateDatePreferenceMutation = useMutation({
    mutationFn: updateDatePreference,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate the date preference query to refetch
        queryClient.invalidateQueries({ queryKey: ['date-preference'] });
        // Also invalidate media items since date preference affects their display
        queryClient.invalidateQueries({ queryKey: ['media-items'] });

        // If deletion scores were recalculated, also invalidate related queries
        if (result.recalculationTriggered) {
          queryClient.invalidateQueries({ queryKey: ['media-items'] });
          queryClient.invalidateQueries({ queryKey: ['media-summary'] });
          queryClient.invalidateQueries({
            queryKey: ['deletion-score-breakdown'],
          });
        }
      } else {
        throw new Error(result.error || 'Failed to update date preference');
      }
    },
  });

  // Mutation: Clear media items
  const clearMediaItemsMutation = useMutation({
    mutationFn: clearMediaItems,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate media items and related queries
        queryClient.invalidateQueries({ queryKey: ['media-items'] });
        queryClient.invalidateQueries({ queryKey: ['processed-media-items'] });
        queryClient.invalidateQueries({ queryKey: ['media-summary'] });
        queryClient.invalidateQueries({
          queryKey: ['deletion-score-breakdown'],
        });

        // Force immediate refetch for any active client queries
        queryClient.refetchQueries({
          queryKey: ['media-items'],
          type: 'active',
        });
        queryClient.refetchQueries({
          queryKey: ['processed-media-items'],
          type: 'active',
        });
      } else {
        throw new Error(result.error || 'Failed to clear media items');
      }
    },
  });

  return {
    datePreferenceQuery,
    updateDatePreferenceMutation,
    clearMediaItemsMutation,
  };
}
