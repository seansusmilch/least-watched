'use client';

import { ServiceSettings } from './service-settings';
import {
  createSonarrSetting,
  updateSonarrSetting,
  deleteSonarrSetting,
  testSonarrConnection,
} from '@/lib/actions/settings';
import type { ServiceSettings as ServiceSettingsType } from '@/lib/utils/prefixed-settings';

interface SonarrSettingsProps {
  initialSettings: ServiceSettingsType[];
}

export function SonarrSettings({ initialSettings }: SonarrSettingsProps) {
  return (
    <ServiceSettings
      initialSettings={initialSettings}
      serviceType='sonarr'
      createSetting={createSonarrSetting}
      updateSetting={updateSonarrSetting}
      deleteSetting={deleteSonarrSetting}
      testConnection={testSonarrConnection}
    />
  );
}
