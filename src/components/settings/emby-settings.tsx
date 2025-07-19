'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { TestTube, Loader2, Play, Edit2, Save, X } from 'lucide-react';

import { useEmbySettings } from '@/hooks/useEmbySettings';
import type { EmbySettings } from '@/lib/utils/single-emby-settings';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface EmbySettingsProps {
  initialSettings: EmbySettings[];
}

export function EmbySettings({ initialSettings }: EmbySettingsProps) {
  const {
    settingsQuery,
    createMutation,
    updateMutation,
    testConnectionMutation,
  } = useEmbySettings();

  const [isEditing, setIsEditing] = useState(false);
  const [preferEmbyDateAdded, setPreferEmbyDateAdded] = useState(false);

  // Connection status state for test connection feedback
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');

  // Use fetched settings or fallback to initialSettings
  const settings = settingsQuery.data || initialSettings;
  const isLoading = settingsQuery.isLoading || settingsQuery.isFetching;

  // Get the single Emby instance (first one) or null if none exists
  const embyInstance = settings.length > 0 ? settings[0] : null;

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const result = await testConnectionMutation.mutateAsync();
      setConnectionStatus(result.connected ? 'success' : 'error');
      if (result.connected) {
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
      if (embyInstance) {
        // Update existing instance
        const result = await updateMutation.mutateAsync({
          input,
        });
        if (result.success) {
          toast.success('Emby settings updated successfully!');
        } else {
          toast.error(result.message || 'Failed to update settings');
        }
      } else {
        // Create new instance
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
    setPreferEmbyDateAdded(embyInstance?.preferEmbyDateAdded ?? false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreferEmbyDateAdded(embyInstance?.preferEmbyDateAdded ?? false);
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
        ) : !embyInstance && !isEditing ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Play className='h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-medium'>
                No Emby configuration
              </h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Set up your Emby server to get started
              </p>
              <Button className='mt-4' onClick={handleEdit}>
                Configure Emby
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            {!isEditing ? (
              <>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white'>
                      <Play className='h-5 w-5' />
                    </div>
                    <div>
                      <CardTitle className='text-lg'>
                        {embyInstance?.name}
                      </CardTitle>
                      <CardDescription>{embyInstance?.url}</CardDescription>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                      variant={embyInstance?.enabled ? 'default' : 'secondary'}
                    >
                      {embyInstance?.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge
                      variant={
                        connectionStatus === 'success'
                          ? 'success'
                          : connectionStatus === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {connectionStatus === 'testing' && (
                        <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                      )}
                      {connectionStatus === 'success' && 'Connected'}
                      {connectionStatus === 'error' && 'Failed'}
                      {connectionStatus === 'idle' && 'Unknown'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                      <Label className='text-sm font-medium'>API Key</Label>
                      <p className='text-sm text-muted-foreground'>
                        {embyInstance?.apiKey.substring(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium'>User ID</Label>
                      <p className='text-sm text-muted-foreground'>
                        {embyInstance?.userId ? embyInstance.userId : 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleTestConnection}
                      disabled={connectionStatus === 'testing'}
                    >
                      {connectionStatus === 'testing' ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className='mr-2 h-4 w-4' />
                          Test Connection
                        </>
                      )}
                    </Button>
                    <Button variant='outline' size='sm' onClick={handleEdit}>
                      <Edit2 className='mr-2 h-4 w-4' />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>
                    {embyInstance
                      ? 'Edit Emby Configuration'
                      : 'Configure Emby Server'}
                  </CardTitle>
                  <CardDescription>
                    {embyInstance
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
                        defaultValue={embyInstance?.name || 'Emby Server'}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor='url'>URL</Label>
                      <Input
                        id='url'
                        name='url'
                        type='url'
                        defaultValue={embyInstance?.url || ''}
                        placeholder='http://localhost:8096'
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor='apiKey'>API Key</Label>
                      <Input
                        id='apiKey'
                        name='apiKey'
                        defaultValue={embyInstance?.apiKey || ''}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor='userId'>User ID (Optional)</Label>
                      <Input
                        id='userId'
                        name='userId'
                        defaultValue={embyInstance?.userId || ''}
                        placeholder='Enter user ID'
                      />
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='enabled'
                        name='enabled'
                        defaultChecked={embyInstance?.enabled ?? true}
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
                      <Button type='submit'>
                        <Save className='mr-2 h-4 w-4' />
                        {embyInstance ? 'Update' : 'Save'}
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
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
