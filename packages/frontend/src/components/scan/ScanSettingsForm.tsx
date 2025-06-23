import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { api, queryKeys } from '@/lib/api';
import type { ScanSettings } from '@/types/scan';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const scanSettingsSchema = z.object({
  days_threshold: z.coerce
    .number()
    .min(1, 'Must be at least 1 day')
    .max(3650, 'Must be less than 3650 days'),
  ignore_newer_than_days: z.coerce
    .number()
    .min(1, 'Must be at least 1 day')
    .max(3650, 'Must be less than 3650 days'),
  concurrent_limit: z.coerce
    .number()
    .min(1, 'Must be at least 1')
    .max(20, 'Must be less than 20'),
  batch_size: z.coerce
    .number()
    .min(10, 'Must be at least 10')
    .max(100, 'Must be less than 100'),
});

type ScanSettingsFormData = z.infer<typeof scanSettingsSchema>;

const defaultSettings: ScanSettings = {
  days_threshold: 365,
  ignore_newer_than_days: 30,
  concurrent_limit: 5,
  batch_size: 40,
};

interface ScanSettingsFormProps {
  onSubmit: (settings: ScanSettings) => void;
  disabled?: boolean;
  submitLabel?: string;
}

export function ScanSettingsForm({
  onSubmit,
  disabled = false,
  submitLabel = 'Start Scan',
}: ScanSettingsFormProps) {
  const { data: configData, isLoading } = useQuery({
    queryKey: queryKeys.config.all,
    queryFn: api.getConfig,
  });

  const form = useForm<ScanSettingsFormData>({
    resolver: zodResolver(scanSettingsSchema),
    defaultValues: defaultSettings,
    disabled,
  });

  useEffect(() => {
    if (configData?.config) {
      // Extract scan settings from the full config
      const scanSettings: ScanSettings = {
        days_threshold: configData.config.days_threshold,
        ignore_newer_than_days: configData.config.ignore_newer_than_days,
        concurrent_limit: configData.config.concurrent_limit,
        batch_size: configData.config.batch_size,
      };
      form.reset(scanSettings);
    }
  }, [configData, form]);

  const handleSubmit = (values: ScanSettingsFormData) => {
    onSubmit(values);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan Settings</CardTitle>
          <CardDescription>
            Configure parameters for the media scan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Settings</CardTitle>
        <CardDescription>
          Configure parameters for the media scan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-6'
          >
            <FormField
              control={form.control}
              name='days_threshold'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unwatched Days Threshold</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='365'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Only include media that has been unwatched for at least this
                    many days
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ignore_newer_than_days'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ignore Media Newer Than (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='30'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Skip media items that were added within this many days
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='concurrent_limit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concurrent Processing Limit</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='5'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of items to process simultaneously
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='batch_size'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Size</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='40'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Number of items to process in each batch
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              disabled={disabled}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors'
            >
              {submitLabel}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
