'use client';

import { ServiceSettings } from '../shared/service-settings';
import {
  createRadarrSetting,
  updateRadarrSetting,
  deleteRadarrSetting,
  testRadarrConnection,
} from '@/lib/actions/settings';
import type { ServiceSettings as ServiceSettingsType } from '@/lib/utils/prefixed-settings';

interface RadarrSettingsProps {
  initialSettings: ServiceSettingsType[];
}

export function RadarrSettings({ initialSettings }: RadarrSettingsProps) {
  return (
    <ServiceSettings
      initialSettings={initialSettings}
      serviceType='radarr'
      createSetting={createRadarrSetting}
      updateSetting={updateRadarrSetting}
      deleteSetting={deleteRadarrSetting}
      testConnection={testRadarrConnection}
    />
  );
}
