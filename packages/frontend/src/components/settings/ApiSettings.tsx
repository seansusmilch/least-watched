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

export function ApiSettings() {
  const form = useFormContext<AppConfig>();

  return (
    <div className='space-y-6'>
      <SettingsSection
        title='Emby'
        description='Configure your Emby server connection.'
      >
        <FormField
          control={form.control}
          name='emby_url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder='https://emby.example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='emby_token'
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Token</FormLabel>
              <FormControl>
                <Input type='password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsSection>

      <SettingsSection
        title='Sonarr'
        description='Configure your Sonarr server connection.'
      >
        <FormField
          control={form.control}
          name='sonarr_url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder='https://sonarr.example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='sonarr_api_key'
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input type='password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsSection>

      <SettingsSection
        title='Radarr'
        description='Configure your Radarr server connection.'
      >
        <FormField
          control={form.control}
          name='radarr_url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder='https://radarr.example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='radarr_api_key'
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input type='password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsSection>
    </div>
  );
}
