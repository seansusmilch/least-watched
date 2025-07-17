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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  TestTube,
  Loader2,
  Play,
} from 'lucide-react';

import { useEmbySettings } from '@/hooks/useEmbySettings';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface EmbySettingsProps {
  initialSettings: ServiceSettings[];
}

export function EmbySettings({ initialSettings }: EmbySettingsProps) {
  const {
    settingsQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    testConnectionMutation,
  } = useEmbySettings();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
  const [preferEmbyDateAdded, setPreferEmbyDateAdded] = useState(false);

  // Connection status state for test connection feedback
  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, ConnectionStatus>
  >({});

  // Use fetched settings or fallback to initialSettings
  const settings = settingsQuery.data || initialSettings;
  const isLoading = settingsQuery.isLoading || settingsQuery.isFetching;

  const handleTestConnection = async (setting: ServiceSettings) => {
    setConnectionStatus((prev) => ({ ...prev, [setting.id]: 'testing' }));
    try {
      const result = await testConnectionMutation.mutateAsync(setting.id);
      setConnectionStatus((prev) => ({
        ...prev,
        [setting.id]: result.connected ? 'success' : 'error',
      }));
      if (result.connected) {
        toast.success(`Successfully connected to ${setting.name}`);
      } else {
        const errorMessage = result.error || 'Unknown error';
        toast.error(errorMessage);
      }
    } catch (e: unknown) {
      setConnectionStatus((prev) => ({ ...prev, [setting.id]: 'error' }));
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
      if (editingId) {
        const result = await updateMutation.mutateAsync({
          id: editingId,
          input,
        });
        if (result.success) {
          toast.success(`${name} has been updated successfully`);
        } else {
          toast.error(result.message || 'Failed to update settings');
        }
      } else {
        const result = await createMutation.mutateAsync(input);
        if (result.success) {
          toast.success(`${name} has been created successfully`);
        } else {
          toast.error(result.message || 'Failed to create settings');
        }
      }
      setEditingId(null);
      setIsAddDialogOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    }
  };

  const handleEdit = (setting: ServiceSettings) => {
    setEditingId(setting.id);
    setIsAddDialogOpen(true);
    setPreferEmbyDateAdded(setting.preferEmbyDateAdded ?? false);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteMutation.mutateAsync(id);
      if (result.success) {
        toast.success('Settings have been deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete settings');
      }
      setIsDeleteDialogOpen(false);
      setSettingToDelete(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete settings');
    }
  };

  const editingSetting = editingId
    ? settings.find((s: ServiceSettings) => s.id === editingId)
    : null;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Emby Settings</h2>
          <p className='text-muted-foreground'>
            Configure your Emby instances for media server management
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Instance
        </Button>
      </div>

      <div className='grid gap-4'>
        {isLoading ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='h-12 w-12 text-muted-foreground animate-spin' />
              <h3 className='mt-4 text-lg font-medium'>
                Loading Emby instances...
              </h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Please wait while we fetch the Emby instances.
              </p>
            </CardContent>
          </Card>
        ) : settings.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Database className='h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-medium'>No Emby instances</h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Add your first Emby instance to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          settings.map((setting: ServiceSettings) => (
            <Card key={setting.id}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white'>
                    <Play className='h-5 w-5' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>{setting.name}</CardTitle>
                    <CardDescription>{setting.url}</CardDescription>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant={setting.enabled ? 'default' : 'secondary'}>
                    {setting.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge
                    variant={
                      connectionStatus[setting.id] === 'success'
                        ? 'default'
                        : connectionStatus[setting.id] === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {connectionStatus[setting.id] === 'testing' && (
                      <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                    )}
                    {connectionStatus[setting.id] === 'success' && 'Connected'}
                    {connectionStatus[setting.id] === 'error' && 'Failed'}
                    {!connectionStatus[setting.id] && 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <Label className='text-sm font-medium'>API Key</Label>
                    <p className='text-sm text-muted-foreground'>
                      {setting.apiKey.substring(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>User ID</Label>
                    <p className='text-sm text-muted-foreground'>
                      {setting.userId ? setting.userId : 'Not set'}
                    </p>
                  </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleTestConnection(setting)}
                    disabled={connectionStatus[setting.id] === 'testing'}
                  >
                    {connectionStatus[setting.id] === 'testing' ? (
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
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleEdit(setting)}
                  >
                    <Edit2 className='mr-2 h-4 w-4' />
                    Edit
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setSettingToDelete(setting.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Emby Instance' : 'Add Emby Instance'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your Emby instance configuration'
                : 'Add a new Emby instance to manage your media server'}
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className='space-y-4'>
            <div>
              <Label htmlFor='name'>Name</Label>
              <Input
                id='name'
                name='name'
                defaultValue={editingSetting?.name || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor='url'>URL</Label>
              <Input
                id='url'
                name='url'
                type='url'
                defaultValue={editingSetting?.url || ''}
                placeholder='http://localhost:8096'
                required
              />
            </div>
            <div>
              <Label htmlFor='apiKey'>API Key</Label>
              <Input
                id='apiKey'
                name='apiKey'
                defaultValue={editingSetting?.apiKey || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor='userId'>User ID (Optional)</Label>
              <Input
                id='userId'
                name='userId'
                defaultValue={editingSetting?.userId || ''}
                placeholder='Enter user ID'
              />
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='enabled'
                name='enabled'
                defaultChecked={editingSetting?.enabled ?? true}
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
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {editingId ? 'Update' : 'Create'} Instance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Emby Instance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this Emby instance? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSettingToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => settingToDelete && handleDelete(settingToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
