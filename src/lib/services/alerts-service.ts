import type { Alert } from '@/lib/types/alerts';
import { sonarrApiClient } from './sonarr-service';
import { radarrApiClient } from './radarr-service';
import { EmbyService } from './emby-service';
import { folderSpaceService } from './folder-space-service';
import {
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
} from '@/lib/database';

const LOW_DISK_SPACE_THRESHOLD_PERCENT = 5;

export class AlertsService {
  async getAllAlerts(): Promise<Alert[]> {
    const [connectionAlerts, diskSpaceAlerts] = await Promise.all([
      this.checkConnectionAlerts(),
      this.checkDiskSpaceAlerts(),
    ]);

    return [...connectionAlerts, ...diskSpaceAlerts];
  }

  private async checkConnectionAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    const [sonarrInstances, radarrInstances, embyInstance] = await Promise.all([
      sonarrSettingsService.getEnabled(),
      radarrSettingsService.getEnabled(),
      embySettingsService.getEnabled(),
    ]);

    const sonarrChecks = sonarrInstances.map(async (instance) => {
      const isConnected = await sonarrApiClient.testConnection(instance);
      if (!isConnected) {
        alerts.push({
          id: `sonarr-connection-${instance.id}`,
          type: 'connection_failure',
          severity: 'error',
          title: 'Sonarr Connection Failed',
          message: `Unable to connect to Sonarr instance "${instance.name}" at ${instance.url}`,
          service: `sonarr:${instance.name}`,
        });
      }
    });

    const radarrChecks = radarrInstances.map(async (instance) => {
      const isConnected = await radarrApiClient.testConnection(instance);
      if (!isConnected) {
        alerts.push({
          id: `radarr-connection-${instance.id}`,
          type: 'connection_failure',
          severity: 'error',
          title: 'Radarr Connection Failed',
          message: `Unable to connect to Radarr instance "${instance.name}" at ${instance.url}`,
          service: `radarr:${instance.name}`,
        });
      }
    });

    const embyCheck = async () => {
      if (embyInstance) {
        const isConnected = await EmbyService.testConnection(embyInstance);
        if (!isConnected) {
          alerts.push({
            id: 'emby-connection',
            type: 'connection_failure',
            severity: 'error',
            title: 'Emby Connection Failed',
            message: `Unable to connect to Emby server at ${embyInstance.url}`,
            service: 'emby',
          });
        }
      }
    };

    await Promise.all([...sonarrChecks, ...radarrChecks, embyCheck()]);

    return alerts;
  }

  private async checkDiskSpaceAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      const folders = await folderSpaceService.getAllFoldersWithSpace();

      for (const folder of folders) {
        if (!folder.isSelected || folder.totalSpace <= 0) {
          continue;
        }

        if (folder.freeSpacePercent < LOW_DISK_SPACE_THRESHOLD_PERCENT) {
          alerts.push({
            id: `disk-space-${folder.instanceType}-${folder.instanceName}-${folder.path}`,
            type: 'low_disk_space',
            severity: 'warning',
            title: 'Low Disk Space',
            message: `Folder "${folder.path}" has only ${folder.freeSpacePercent.toFixed(1)}% free space remaining`,
            service: `${folder.instanceType}:${folder.instanceName}`,
            path: folder.path,
          });
        }
      }
    } catch (error) {
      console.error('Failed to check disk space alerts:', error);
    }

    return alerts;
  }
}

export const alertsService = new AlertsService();
