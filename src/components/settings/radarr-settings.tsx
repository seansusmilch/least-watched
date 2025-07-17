'use client';

import { useState, useOptimistic } from 'react';
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
  Globe,
  Plus,
  Edit2,
  Trash2,
  TestTube,
  Folder,
  Loader2,
  Clapperboard,
} from 'lucide-react';

import {
  createRadarrSetting,
  updateRadarrSetting,
  deleteRadarrSetting,
  testRadarrConnection,
} from '@/lib/actions/settings';

import { FolderSelectionDialog } from './folder-selection-dialog';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface RadarrSettingsProps {
  initialSettings: ServiceSettings[];
}

export function RadarrSettings({ initialSettings }: RadarrSettingsProps) {
  const [optimisticSettings, setOptimisticSettings] = useOptimistic(
    initialSettings,
    (state, action: { type: string; payload: unknown }) => {
      switch (action.type) {
        case 'add':
          return [...state, action.payload as ServiceSettings];
        case 'update':
          return state.map((s) =>
            s.id === (action.payload as Partial<ServiceSettings>).id
              ? { ...s, ...(action.payload as Partial<ServiceSettings>) }
              : s
          );
        case 'delete':
          return state.filter((s) => s.id !== action.payload);
        default:
          return state;
      }
    }
  );

  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [currentSettingId, setCurrentSettingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);

  const resetForm = () => {
    // setFormData({ // setFormData is not defined
    //   name: '',
    //   url: '',
    //   apiKey: '',
    //   enabled: true,
    // });
    setEditingId(null);
  };

  const handleSubmit = async (formData: FormData) => {
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const apiKey = formData.get('apiKey') as string;
    const enabled = formData.get('enabled') === 'on';

    try {
      let result;
      if (editingId) {
        result = await updateRadarrSetting(editingId, {
          name,
          url,
          apiKey,
          enabled,
        });
        setOptimisticSettings({ type: 'update', payload: result });
      } else {
        result = await createRadarrSetting({
          name,
          url,
          apiKey,
          enabled,
        });
        setOptimisticSettings({ type: 'add', payload: result });
      }

      setEditingId(null);
      setIsAddDialogOpen(false);
      resetForm();
      toast.success(
        `${name} has been ${editingId ? 'updated' : 'created'} successfully`
      );
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleEdit = (setting: ServiceSettings) => {
    // setFormData({ // setFormData is not defined
    //   name: setting.name,
    //   url: setting.url,
    //   apiKey: setting.apiKey,
    //   enabled: setting.enabled,
    // });
    setEditingId(setting.id);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRadarrSetting(id);
      setOptimisticSettings({ type: 'delete', payload: id });
      setIsDeleteDialogOpen(false);
      setSettingToDelete(null);
      toast.success('Settings have been deleted successfully');
    } catch {
      toast.error('Failed to delete settings');
    }
  };

  const handleTestConnection = async (setting: ServiceSettings) => {
    setConnectionStatus((prev) => ({ ...prev, [setting.id]: 'testing' }));

    try {
      const result = await testRadarrConnection(setting.id);
      const isConnected =
        result.success && 'connected' in result && result.connected;
      setConnectionStatus((prev) => ({
        ...prev,
        [setting.id]: isConnected ? 'success' : 'error',
      }));

      if (isConnected) {
        toast.success(`Successfully connected to ${setting.name}`);
      } else {
        const errorMessage =
          'error' in result
            ? result.error
            : 'message' in result
            ? result.message
            : 'Connection failed';
        toast.error(errorMessage);
      }
    } catch {
      setConnectionStatus((prev) => ({ ...prev, [setting.id]: 'error' }));
      toast.error('Failed to test connection');
    }
  };

  const handleFolderSelection = (settingId: string) => {
    setCurrentSettingId(settingId);
    setFolderDialogOpen(true);
  };

  const handleFolderSave = async (selectedFolders: string[]) => {
    if (!currentSettingId) return;

    try {
      await updateRadarrSetting(currentSettingId, { selectedFolders });
      setOptimisticSettings({
        type: 'update',
        payload: { id: currentSettingId, selectedFolders },
      });
      setFolderDialogOpen(false);
      setCurrentSettingId(null);
      toast.success('Selected folders have been updated successfully');
    } catch {
      toast.error('Failed to update folders');
    }
  };

  const currentSetting = currentSettingId
    ? optimisticSettings.find((s) => s.id === currentSettingId)
    : null;

  const editingSetting = editingId
    ? optimisticSettings.find((s) => s.id === editingId)
    : null;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Radarr Settings</h2>
          <p className='text-muted-foreground'>
            Configure your Radarr instances for movie management
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Add Instance
        </Button>
      </div>

      <div className='grid gap-4'>
        {optimisticSettings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500 text-white'>
                  <Clapperboard className='h-5 w-5 text-black' />
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
                  <Label className='text-sm font-medium'>
                    Selected Folders
                  </Label>
                  <p className='text-sm text-muted-foreground'>
                    {setting.selectedFolders &&
                    setting.selectedFolders.length > 0
                      ? `${setting.selectedFolders.length} folder(s) selected`
                      : 'No folders selected'}
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
                  onClick={() => handleFolderSelection(setting.id)}
                >
                  <Folder className='mr-2 h-4 w-4' />
                  Select Folders
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
        ))}

        {optimisticSettings.length === 0 && (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Globe className='h-12 w-12 text-muted-foreground' />
              <h3 className='mt-4 text-lg font-medium'>No Radarr instances</h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Add your first Radarr instance to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Radarr Instance' : 'Add Radarr Instance'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your Radarr instance configuration'
                : 'Add a new Radarr instance to manage your movies'}
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
                placeholder='http://localhost:7878'
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
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='enabled'
                name='enabled'
                defaultChecked={editingSetting?.enabled ?? true}
              />
              <Label htmlFor='enabled'>Enabled</Label>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingId(null);
                  resetForm();
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
            <DialogTitle>Delete Radarr Instance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this Radarr instance? This action
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

      {/* Folder Selection Dialog */}
      {currentSetting && (
        <FolderSelectionDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          instanceId={currentSetting.id}
          instanceName={currentSetting.name}
          instanceType='radarr'
          currentSelectedFolders={currentSetting.selectedFolders || []}
          onSave={handleFolderSave}
        />
      )}
    </div>
  );
}
