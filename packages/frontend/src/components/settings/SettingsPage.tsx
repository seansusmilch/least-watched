import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { api, queryKeys } from '@/lib/api';
import type { AppConfig } from '@/types/config';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiSettings } from './ApiSettings';
import { ScanSettings } from './ScanSettings';
import { GeneralSettings } from './GeneralSettings';

const configSchema = z.object({
  emby_url: z.string().url().optional().or(z.literal('')),
  emby_token: z.string().optional(),
  sonarr_url: z.string().url().optional().or(z.literal('')),
  sonarr_api_key: z.string().optional(),
  radarr_url: z.string().url().optional().or(z.literal('')),
  radarr_api_key: z.string().optional(),
  days_threshold: z.coerce.number().min(1).max(3650),
  ignore_newer_than_days: z.coerce.number().min(1).max(3650),
  concurrent_limit: z.coerce.number().min(1).max(20),
  batch_size: z.coerce.number().min(10).max(100),
  timezone: z.string(),
});

type ConfigFormData = z.infer<typeof configSchema>;

const defaultConfig: AppConfig = {
  emby_url: '',
  emby_token: '',
  sonarr_url: '',
  sonarr_api_key: '',
  radarr_url: '',
  radarr_api_key: '',
  days_threshold: 365,
  ignore_newer_than_days: 30,
  concurrent_limit: 5,
  batch_size: 40,
  timezone: 'UTC',
};

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useQuery({
    queryKey: queryKeys.config.all,
    queryFn: api.getConfig,
  });

  const mutation = useMutation({
    mutationFn: (values: Partial<AppConfig>) => api.updateConfig(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all });
      toast.success('Configuration saved successfully.');
    },
    onError: (error) => {
      toast.error('Failed to save configuration.');
      console.error('Failed to update config:', error);
    },
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: defaultConfig,
    disabled: mutation.isPending,
  });

  useEffect(() => {
    if (configData?.config) {
      form.reset(configData.config);
    }
  }, [configData, form]);

  const onSubmit = (values: ConfigFormData) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center p-24'>
        <div className='max-w-7xl mx-auto w-full text-center'>
          <h2 className='text-2xl font-semibold mb-4'>Loading...</h2>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto'></div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex min-h-screen flex-col p-8'>
      <div className='max-w-7xl mx-auto w-full'>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-4xl font-bold mb-2'>Settings</h1>
                <p className='text-gray-300'>
                  Manage your server connections and application settings.
                </p>
              </div>
              <Button
                type='submit'
                disabled={mutation.isPending}
                className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors'
              >
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            <Tabs defaultValue='api' className='space-y-6'>
              <TabsList className='bg-gray-700 p-1 rounded-lg'>
                <TabsTrigger
                  value='api'
                  className='data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300 px-4 py-2 rounded-md transition-colors'
                >
                  API
                </TabsTrigger>
                <TabsTrigger
                  value='scan'
                  className='data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300 px-4 py-2 rounded-md transition-colors'
                >
                  Scan
                </TabsTrigger>
                <TabsTrigger
                  value='general'
                  className='data-[state=active]:bg-gray-600 data-[state=active]:text-white text-gray-300 px-4 py-2 rounded-md transition-colors'
                >
                  General
                </TabsTrigger>
              </TabsList>

              <TabsContent value='api' className='space-y-6'>
                <ApiSettings />
              </TabsContent>
              <TabsContent value='scan' className='space-y-6'>
                <ScanSettings />
              </TabsContent>
              <TabsContent value='general' className='space-y-6'>
                <GeneralSettings />
              </TabsContent>
            </Tabs>
          </form>
        </FormProvider>
      </div>
    </main>
  );
}
