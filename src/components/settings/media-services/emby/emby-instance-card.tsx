'use client';

import { ServiceInstanceCard } from '../shared/service-instance-card';
import type { EmbySettings } from '@/lib/utils/single-emby-settings';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface EmbyInstanceCardProps {
  setting: EmbySettings;
  connectionStatus?: ConnectionStatus;
  onTestConnection: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectLibraries?: () => void;
}

// Convert EmbySettings to ServiceSettings format
function convertEmbyToServiceSettings(
  embySettings: EmbySettings
): ServiceSettings {
  return {
    id: 'single', // Emby only has one instance
    name: embySettings.name,
    url: embySettings.url,
    apiKey: embySettings.apiKey,
    enabled: embySettings.enabled,
    selectedFolders:
      embySettings.selectedLibraries ?? embySettings.selectedFolders,
    createdAt: embySettings.createdAt || new Date(),
    updatedAt: embySettings.updatedAt || new Date(),
  };
}

export function EmbyInstanceCard({
  setting,
  connectionStatus = 'idle',
  onTestConnection,
  onEdit,
  onDelete,
  onSelectLibraries,
}: EmbyInstanceCardProps) {
  const serviceSetting = convertEmbyToServiceSettings(setting);

  return (
    <ServiceInstanceCard
      setting={serviceSetting}
      connectionStatus={connectionStatus}
      serviceType='emby'
      onTestConnection={onTestConnection}
      onEdit={onEdit}
      onDelete={onDelete}
      onSelectFolders={() => {}}
      onSelectLibraries={onSelectLibraries}
    />
  );
}
