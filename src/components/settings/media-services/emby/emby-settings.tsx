'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Play, Save, X } from 'lucide-react';

import { useEmbySettings } from '@/hooks/useEmbySettings';
import { EmbyInstanceCard } from './emby-instance-card';
import type { EmbySettings } from '@/lib/utils/single-emby-settings';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface EmbySettingsProps {
  initialSettings: EmbySettings | null;
}

export function EmbySettingsTab({ initialSettings }: EmbySettingsProps) {
  const {
    settingsQuery,
    createMutation,
    updateMutation,
    testConnectionMutation,
  } = useEmbySettings();

  const [isEditing, setIsEditing] = useState(false);
  const [preferEmbyDateAdded, setPreferEmbyDateAdded] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');

  const settings = settingsQuery.data || initialSettings;
  const isLoading = settingsQuery.isLoading || settingsQuery.isFetching;

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const result = await testConnectionMutation.mutateAsync();
      setConnectionStatus(result.success ? 'success' : 'error');
      if (result.success) {
        toast.success('Connection successful!');
      } else {
        const errorMessage = result.error || 'Unknown error';
        toast.error(errorMessage);
      }
    } catch (e: unknown) {
      setConnectionStatus('error');
      toast.error(e instanceof Error ? e.message : 'Failed to test connection');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const apiKey = formData.get('apiKey') as string;
    const userId = formData.get('userId') as string;
    const enabled = formData.get('enabled') === 'on';
    const preferEmbyDateAdded = formData.get('preferEmbyDateAdded') === 'on';

    const input = {
      name,
      url,
      apiKey,
      userId,
      enabled,
      preferEmbyDateAdded,
    };

    try {
      if (settings) {
        const result = await updateMutation.mutateAsync({ input });
        if (result.success) {
          toast.success('Emby settings updated successfully!');
        } else {
          toast.error(result.message || 'Failed to update settings');
        }
      } else {
        const result = await createMutation.mutateAsync(input);
        if (result.success) {
          toast.success('Emby settings created successfully!');
        } else {
          toast.error(result.message || 'Failed to create settings');
        }
      }
      setIsEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPreferEmbyDateAdded(settings?.preferEmbyDateAdded ?? false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreferEmbyDateAdded(settings?.preferEmbyDateAdded ?? false);
  };

  const handleDelete = async () => {
    // Implement delete functionality if needed
    toast.info('Delete functionality not implemented for single Emby instance');
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Emby Settings</h2>
          <p className='text-muted-foreground'>
            Configure your Emby server for media management
          </p>
        </div>
      </div>

      <div className='grid gap-4'>
        {isLoading ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='h-12 w-12 text-muted-foreground animate-spin' />
              <h3 className='mt-4 text-lg font-medium'>
                Loading Emby settings...
              </h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Please wait while we fetch the Emby configuration.
              </p>
            </CardContent>
          </Card>
        ) : !settings && !isEditing ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Play className='h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-medium'>
                No Emby configuration
              </h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Set up your Emby server to get started
              </p>
              <Button
                className='mt-4'
                onClick={handleEdit}
                data-testid='add-emby-instance'
              >
                Configure Emby
              </Button>
            </CardContent>
          </Card>
        ) : !isEditing ? (
          <EmbyInstanceCard
            setting={settings!}
            connectionStatus={connectionStatus}
            onTestConnection={handleTestConnection}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {settings ? 'Edit Emby Configuration' : 'Configure Emby Server'}
              </CardTitle>
              <CardDescription>
                {settings
                  ? 'Update your Emby server configuration'
                  : 'Add your Emby server details to manage your media'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleSubmit} className='space-y-4'>
                <div>
                  <Label htmlFor='name'>Name</Label>
                  <Input
                    id='name'
                    name='name'
                    data-testid='instance-name'
                    defaultValue={settings?.name || 'Emby Server'}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='url'>URL</Label>
                  <Input
                    id='url'
                    name='url'
                    type='url'
                    data-testid='instance-url'
                    defaultValue={settings?.url || ''}
                    placeholder='http://localhost:8096'
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='apiKey'>API Key</Label>
                  <Input
                    id='apiKey'
                    name='apiKey'
                    data-testid='instance-api-key'
                    defaultValue={settings?.apiKey || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='userId'>User ID (Optional)</Label>
                  <Input
                    id='userId'
                    name='userId'
                    defaultValue={settings?.userId || ''}
                    placeholder='Enter user ID'
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='enabled'
                    name='enabled'
                    defaultChecked={settings?.enabled ?? true}
                  />
                  <Label htmlFor='enabled'>Enabled</Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='preferEmbyDateAdded'
                    name='preferEmbyDateAdded'
                    checked={preferEmbyDateAdded}
                    onCheckedChange={(checked) =>
                      setPreferEmbyDateAdded(checked === true)
                    }
                  />
                  <Label htmlFor='preferEmbyDateAdded'>
                    Prefer Emby Date Added
                  </Label>
                </div>
                <div className='flex gap-2 pt-4'>
                  <Button type='submit' data-testid='save-instance'>
                    <Save className='mr-2 h-4 w-4' />
                    {settings ? 'Update' : 'Save'}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleCancel}
                  >
                    <X className='mr-2 h-4 w-4' />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
