'use client';

import React, { useState, useOptimistic } from 'react';
import { toast } from 'sonner';
import { Plus, Monitor, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { ServiceInstanceCard } from './service-instance-card';
import { ServiceInstanceDialog } from './service-instance-dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { FolderSelectionDialog } from './folder-selection-dialog';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';
import type { FormState } from '@/lib/validation/schemas';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

// Type for test connection result
type TestConnectionResult = { success: boolean; error?: string };

interface ServiceSettingsProps {
  initialSettings: ServiceSettings[];
  serviceType: 'sonarr' | 'radarr';
  // Service-specific action functions
  createSetting: (data: ServiceFormData) => Promise<FormState>;
  updateSetting: (
    id: string,
    data: Partial<ServiceFormData>
  ) => Promise<FormState>;
  deleteSetting: (id: string) => Promise<FormState>;
  testConnection: (id: string) => Promise<TestConnectionResult>;
}

type OptimisticAction =
  | { type: 'add'; payload: ServiceSettings }
  | { type: 'update'; payload: Partial<ServiceSettings> & { id: string } }
  | { type: 'delete'; payload: string };

interface ServiceFormData {
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  selectedFolders?: string[];
}

export function ServiceSettings({
  initialSettings,
  serviceType,
  createSetting,
  updateSetting,
  deleteSetting,
  testConnection,
}: ServiceSettingsProps) {
  const [optimisticSettings, setOptimisticSettings] = useOptimistic<
    ServiceSettings[],
    OptimisticAction
  >(initialSettings, (state, action) => {
    switch (action.type) {
      case 'add':
        return [...state, action.payload];
      case 'update':
        return state.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        );
      case 'delete':
        return state.filter((s) => s.id !== action.payload);
      default:
        return state;
    }
  });

  const [connectionStatus, setConnectionStatus] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [currentSettingId, setCurrentSettingId] = useState<string | null>(null);

  const handleTestConnection = async (
    setting: ServiceSettings
  ): Promise<void> => {
    setConnectionStatus((prev) => ({ ...prev, [setting.id]: 'testing' }));

    try {
      const result = await testConnection(setting.id);
      setConnectionStatus((prev) => ({
        ...prev,
        [setting.id]: result.success ? 'success' : 'error',
      }));

      if (result.success) {
        toast.success('Connection successful');
      } else {
        toast.error(result.error || 'Unknown error');
      }
    } catch {
      setConnectionStatus((prev) => ({ ...prev, [setting.id]: 'error' }));
      toast.error('Failed to test connection');
    }
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    const formDataObj: ServiceFormData = {
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      apiKey: formData.get('apiKey') as string,
      enabled: formData.get('enabled') === 'on',
    };

    try {
      let result: FormState;
      if (editingId) {
        result = await updateSetting(editingId, formDataObj);
        if (result.success && result.data) {
          setOptimisticSettings({
            type: 'update',
            payload: result.data as ServiceSettings,
          });
        }
      } else {
        result = await createSetting(formDataObj);
        if (result.success && result.data) {
          setOptimisticSettings({
            type: 'add',
            payload: result.data as ServiceSettings,
          });
        }
      }

      if (result.success) {
        toast.success(result.message || 'Settings saved successfully');
        setEditingId(null);
        setIsAddDialogOpen(false);
      } else {
        toast.error(result.message || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const result = await deleteSetting(id);
      if (result.success) {
        setOptimisticSettings({ type: 'delete', payload: id });
        setIsDeleteDialogOpen(false);
        setSettingToDelete(null);
        toast.success(result.message || 'Settings deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete settings');
      }
    } catch {
      toast.error('Failed to delete settings');
    }
  };

  const handleFolderSave = async (selectedFolders: string[]): Promise<void> => {
    if (!currentSettingId) return;

    try {
      const result: FormState = await updateSetting(currentSettingId, {
        selectedFolders,
      });
      if (result.success && result.data) {
        setOptimisticSettings({
          type: 'update',
          payload: { id: currentSettingId, selectedFolders },
        });
        setFolderDialogOpen(false);
        setCurrentSettingId(null);
        toast.success('Folders updated successfully');
      } else {
        toast.error(result.message || 'Failed to update folders');
      }
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

  const serviceName = serviceType === 'sonarr' ? 'Sonarr' : 'Radarr';
  const serviceDescription =
    serviceType === 'sonarr' ? 'TV show management' : 'movie management';
  const emptyStateIcon = serviceType === 'sonarr' ? Monitor : Globe;
  const testId = `add-${serviceType}-instance`;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>{serviceName} Settings</h2>
          <p className='text-muted-foreground'>
            Configure your {serviceName} instances for {serviceDescription}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid={testId}>
          <Plus className='mr-2 h-4 w-4' />
          Add Instance
        </Button>
      </div>

      <div className='grid gap-4' data-testid='instance-list'>
        {optimisticSettings.map((setting) => (
          <ServiceInstanceCard
            key={setting.id}
            setting={setting}
            serviceType={serviceType}
            connectionStatus={connectionStatus[setting.id]}
            onTestConnection={() => handleTestConnection(setting)}
            onEdit={() => {
              setEditingId(setting.id);
              setIsAddDialogOpen(true);
            }}
            onDelete={() => {
              setSettingToDelete(setting.id);
              setIsDeleteDialogOpen(true);
            }}
            onSelectFolders={() => {
              setCurrentSettingId(setting.id);
              setFolderDialogOpen(true);
            }}
          />
        ))}

        {optimisticSettings.length === 0 && (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              {React.createElement(emptyStateIcon, {
                className: 'h-12 w-12 text-muted-foreground',
              })}
              <h3 className='mt-4 text-lg font-medium'>
                No {serviceName} instances
              </h3>
              <p className='mt-2 text-sm text-muted-foreground'>
                Add your first {serviceName} instance to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ServiceInstanceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        editingSetting={editingSetting}
        serviceType={serviceType}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsAddDialogOpen(false);
          setEditingId(null);
        }}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Delete ${serviceName} Instance`}
        description={`Are you sure you want to delete this ${serviceName} instance? This action cannot be undone.`}
        onConfirm={() => settingToDelete && handleDelete(settingToDelete)}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setSettingToDelete(null);
        }}
      />

      <FolderSelectionDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        instanceType={serviceType}
        instanceId={currentSettingId || ''}
        instanceName={currentSetting?.name || ''}
        currentSelectedFolders={currentSetting?.selectedFolders || []}
        onSave={handleFolderSave}
      />
    </div>
  );
}
