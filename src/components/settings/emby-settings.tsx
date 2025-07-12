'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { AddInstanceDialog } from './add-instance-dialog';
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
  Edit,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

import {
  createEmbySetting,
  updateEmbySetting,
  deleteEmbySetting,
  testEmbyConnection,
  type EmbySettingsInput,
} from '@/lib/actions/settings';

type EmbySetting = {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  userId?: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface EmbySettingsProps {
  initialSettings: EmbySetting[];
}

export function EmbySettings({ initialSettings }: EmbySettingsProps) {
  const [optimisticSettings, setOptimisticSettings] = useOptimistic(
    initialSettings,
    (
      state,
      action: {
        type: 'add' | 'update' | 'delete';
        payload: Partial<EmbySetting> & { id: string };
      }
    ) => {
      switch (action.type) {
        case 'add':
          return [...state, action.payload as EmbySetting];
        case 'update':
          return state.map((s) =>
            s.id === action.payload.id ? { ...s, ...action.payload } : s
          );
        case 'delete':
          return state.filter((s) => s.id !== action.payload.id);
        default:
          return state;
      }
    }
  );

  const [isPending, startTransition] = useTransition();
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<EmbySetting | null>(
    null
  );

  const [formData, setFormData] = useState<EmbySettingsInput>({
    name: '',
    url: '',
    apiKey: '',
    userId: '',
    enabled: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      apiKey: '',
      userId: '',
      enabled: true,
    });
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.url || !formData.apiKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    startTransition(async () => {
      const tempId = `temp-${Date.now()}`;
      setOptimisticSettings({
        type: 'add',
        payload: {
          id: tempId,
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const result = await createEmbySetting(formData);

      if (result.success) {
        toast.success('Emby instance created successfully');
        resetForm();
        setShowAddDialog(false);
      } else {
        toast.error(result.error || 'Failed to create Emby instance');
      }
    });
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name || !formData.url || !formData.apiKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    startTransition(async () => {
      setOptimisticSettings({
        type: 'update',
        payload: { id, ...formData },
      });

      const result = await updateEmbySetting(id, formData);

      if (result.success) {
        toast.success('Emby instance updated successfully');
        resetForm();
      } else {
        toast.error(result.error || 'Failed to update Emby instance');
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      setOptimisticSettings({
        type: 'delete',
        payload: { id },
      });

      const result = await deleteEmbySetting(id);

      if (result.success) {
        toast.success('Emby instance deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete Emby instance');
      }
    });
  };

  const openDeleteConfirmation = (setting: EmbySetting) => {
    setInstanceToDelete(setting);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (instanceToDelete) {
      handleDelete(instanceToDelete.id);
      setDeleteConfirmOpen(false);
      setInstanceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setInstanceToDelete(null);
  };

  const handleTestConnection = async (id: string) => {
    setConnectionStatus((prev) => ({ ...prev, [id]: 'testing' }));

    const result = await testEmbyConnection(id);

    setConnectionStatus((prev) => ({
      ...prev,
      [id]: result.success && result.connected ? 'success' : 'error',
    }));

    if (result.success && result.connected) {
      toast.success('Connection successful');
    } else {
      toast.error(result.error || 'Connection failed');
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    startTransition(async () => {
      setOptimisticSettings({
        type: 'update',
        payload: { id, enabled },
      });

      const result = await updateEmbySetting(id, { enabled });

      if (!result.success) {
        toast.error(result.error || 'Failed to update Emby instance');
      }
    });
  };

  const startEdit = (setting: EmbySetting) => {
    setFormData({
      name: setting.name,
      url: setting.url,
      apiKey: setting.apiKey,
      userId: setting.userId || '',
      enabled: setting.enabled,
    });
    setEditingId(setting.id);
  };

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'testing':
        return <RefreshCw className='h-4 w-4 animate-spin' />;
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'testing':
        return <Badge variant='outline'>Testing...</Badge>;
      case 'success':
        return <Badge variant='default'>Connected</Badge>;
      case 'error':
        return <Badge variant='destructive'>Failed</Badge>;
      default:
        return <Badge variant='secondary'>Not Tested</Badge>;
    }
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Database className='h-5 w-5' />
              Emby Instances
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowApiKeys(!showApiKeys)}
              >
                {showApiKeys ? (
                  <EyeOff className='h-4 w-4 mr-2' />
                ) : (
                  <Eye className='h-4 w-4 mr-2' />
                )}
                {showApiKeys ? 'Hide' : 'Show'} API Keys
              </Button>
              <AddInstanceDialog
                title='Add Emby Instance'
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                formData={formData}
                onFormDataChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
                onSubmit={handleCreate}
                onCancel={() => {
                  resetForm();
                  setShowAddDialog(false);
                }}
                isPending={isPending}
                fields={[
                  {
                    id: 'name',
                    label: 'Name',
                    placeholder: 'Main Emby',
                    required: true,
                  },
                  {
                    id: 'url',
                    label: 'URL',
                    placeholder: 'http://localhost:8096',
                    required: true,
                  },
                  {
                    id: 'apiKey',
                    label: 'API Key',
                    type: 'password',
                    placeholder: 'Enter API key',
                    required: true,
                  },
                  {
                    id: 'userId',
                    label: 'User ID (Optional)',
                    placeholder: 'Enter user ID',
                    required: false,
                  },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {optimisticSettings.length === 0 ? (
              <div className='text-center py-8'>
                <Database className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                <h3 className='text-lg font-medium mb-2'>No Emby instances</h3>
                <p className='text-muted-foreground mb-4'>
                  Add your first Emby instance to get started
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Instance
                </Button>
              </div>
            ) : (
              optimisticSettings.map((setting) => (
                <Card
                  key={setting.id}
                  className='border-l-4 border-l-purple-500'
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-4'>
                        <div>
                          <h3 className='font-medium'>{setting.name}</h3>
                          <p className='text-sm text-muted-foreground'>
                            {setting.url}
                          </p>
                          {setting.userId && (
                            <p className='text-xs text-muted-foreground'>
                              User ID: {setting.userId}
                            </p>
                          )}
                          {showApiKeys && (
                            <p className='text-xs text-muted-foreground font-mono'>
                              {setting.apiKey}
                            </p>
                          )}
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Switch
                            checked={setting.enabled}
                            onCheckedChange={(enabled) =>
                              handleToggleEnabled(setting.id, enabled)
                            }
                            disabled={isPending}
                          />
                          <span className='text-sm'>
                            {setting.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <div className='flex items-center space-x-2'>
                          {getStatusIcon(connectionStatus[setting.id])}
                          {getStatusBadge(connectionStatus[setting.id])}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleTestConnection(setting.id)}
                          disabled={
                            connectionStatus[setting.id] === 'testing' ||
                            isPending
                          }
                        >
                          <TestTube className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => startEdit(setting)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openDeleteConfirmation(setting)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={() => resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Emby Instance</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-name'>Name</Label>
              <Input
                id='edit-name'
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder='Main Emby'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-url'>URL</Label>
              <Input
                id='edit-url'
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder='http://localhost:8096'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-apiKey'>API Key</Label>
              <Input
                id='edit-apiKey'
                type='password'
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder='Enter API key'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-userId'>User ID (Optional)</Label>
              <Input
                id='edit-userId'
                value={formData.userId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, userId: e.target.value }))
                }
                placeholder='Enter user ID'
              />
            </div>
            <div className='flex items-center space-x-2'>
              <Switch
                id='edit-enabled'
                checked={formData.enabled}
                onCheckedChange={(enabled) =>
                  setFormData((prev) => ({ ...prev, enabled }))
                }
              />
              <Label htmlFor='edit-enabled'>Enable this instance</Label>
            </div>
            <div className='flex justify-end space-x-2'>
              <Button variant='outline' onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={() => editingId && handleUpdate(editingId)}
                disabled={isPending}
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete the Emby instance &quot;
              {instanceToDelete?.name}&quot;. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
