import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmbySettings,
  createEmbySetting,
  updateEmbySetting,
  deleteEmbySetting,
  testEmbyConnection,
} from '@/lib/actions/settings/emby';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';
import type { EmbySettingsInput } from '@/lib/actions/settings/types';

export function useEmbySettings() {
  const queryClient = useQueryClient();

  // Query: Fetch all Emby settings
  const settingsQuery = useQuery<ServiceSettings[]>({
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
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<EmbySettingsInput>;
    }) => {
      return updateEmbySetting(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emby-settings'] });
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteEmbySetting(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emby-settings'] });
    },
  });

  // Mutation: Test Connection
  const testConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return testEmbyConnection(id);
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
