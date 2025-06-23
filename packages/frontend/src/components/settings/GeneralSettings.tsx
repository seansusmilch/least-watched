import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsSection } from './SettingsSection';
import type { AppConfig } from '@/types/config';

// A partial list of timezones for demonstration purposes
const timezones = [
  'UTC',
  'GMT',
  'US/Pacific',
  'US/Mountain',
  'US/Central',
  'US/Eastern',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
];

export function GeneralSettings() {
  const form = useFormContext<AppConfig>();

  return (
    <div className='space-y-6'>
      <SettingsSection
        title='General'
        description='Configure general application settings.'
      >
        <FormField
          control={form.control}
          name='timezone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a timezone' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsSection>
    </div>
  );
}
