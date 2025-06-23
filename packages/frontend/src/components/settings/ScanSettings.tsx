import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SettingsSection } from './SettingsSection';
import type { AppConfig } from '@/types/config';

export function ScanSettings() {
  const form = useFormContext<AppConfig>();

  return (
    <div className='space-y-6'>
      <SettingsSection
        title='Scan Parameters'
        description='Adjust the parameters for the media scan.'
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
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
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
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='concurrent_limit'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Concurrent Limit</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
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
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsSection>
    </div>
  );
}
