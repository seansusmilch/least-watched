import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmbySettings,
  createEmbySetting,
  updateEmbySetting,
  deleteEmbySetting,
  testEmbyConnection,
} from '@/lib/actions/settings/emby';
import type { EmbySettings } from '@/lib/utils/single-emby-settings';
import type { EmbySettingsInput } from '@/lib/actions/settings/types';

export function useEmbySettings() {
  const queryClient = useQueryClient();

  // Query: Fetch Emby setting (returns array for compatibility)
  const settingsQuery = useQuery<EmbySettings[]>({
    queryKey: ['emby-settings'],
    queryFn: getEmbySettings,
  });

  // Mutation: Create
  const createMutation = useMutation({
    mutationFn: async (input: EmbySettingsInput) => {
      return createEmbySetting(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emby-settings'] });
    },
  });

  // Mutation: Update
  const updateMutation = useMutation({
    mutationFn: async ({ input }: { input: Partial<EmbySettingsInput> }) => {
      return updateEmbySetting(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emby-settings'] });
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return deleteEmbySetting();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emby-settings'] });
    },
  });

  // Mutation: Test Connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return testEmbyConnection();
    },
  });

  return {
    settingsQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    testConnectionMutation,
  };
}
