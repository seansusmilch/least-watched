import type { ServiceSettings } from '@/lib/utils/prefixed-settings';
import { client as sonarrClientRaw } from '@/generated/sonarr/client.gen';
import {
  getApiV3Rootfolder as getSonarrRootfolder,
  getApiV3Diskspace as getSonarrDiskspace,
  getApiV3Series as getSonarrSeries,
  getApiV3SeriesById as getSonarrSeriesById,
  getApiV3SystemStatus as getSonarrSystemStatus,
} from '@/generated/sonarr/sdk.gen';
import type {
  RootFolderResource as SonarrRootFolderResource,
  DiskSpaceResource as SonarrDiskSpaceResource,
  SeriesResource as SonarrSeriesResource,
} from '@/generated/sonarr/types.gen';
import {
  safeApiCall,
  DEFAULT_TIMEOUT,
  createFetchWithTimeout,
} from './shared/api-utils';

export type SonarrSeries = SonarrSeriesResource;
export type SonarrRootFolder = SonarrRootFolderResource;
export type SonarrDiskSpace = SonarrDiskSpaceResource;

export class SonarrApiClient {
  private configureClient(instance: ServiceSettings) {
    sonarrClientRaw.setConfig({
      baseUrl: instance.url,
      headers: { 'X-Api-Key': instance.apiKey },
      fetch: createFetchWithTimeout(DEFAULT_TIMEOUT),
    });
  }

  async getRootFolders(
    instance: ServiceSettings
  ): Promise<SonarrRootFolderResource[]> {
    this.configureClient(instance);
    return safeApiCall(
      () => getSonarrRootfolder({ client: sonarrClientRaw }),
      [],
      `Sonarr ${instance.name} root folders`
    );
  }

  async getDiskSpace(
    instance: ServiceSettings
  ): Promise<SonarrDiskSpaceResource[]> {
    this.configureClient(instance);
    return safeApiCall(
      () => getSonarrDiskspace({ client: sonarrClientRaw }),
      [],
      `Sonarr ${instance.name} disk space`
    );
  }

  async getSeries(instance: ServiceSettings): Promise<SonarrSeriesResource[]> {
    this.configureClient(instance);
    return safeApiCall(
      () => getSonarrSeries({ client: sonarrClientRaw }),
      [],
      `Sonarr ${instance.name} series`
    );
  }

  async getSeriesById(
    instance: ServiceSettings,
    id: number
  ): Promise<SonarrSeriesResource | null> {
    this.configureClient(instance);
    return safeApiCall(
      () => getSonarrSeriesById({ client: sonarrClientRaw, path: { id } }),
      null,
      `Sonarr ${instance.name} series by ID ${id}`
    );
  }

  async testConnection(instance: ServiceSettings): Promise<boolean> {
    this.configureClient(instance);
    try {
      const result = await getSonarrSystemStatus({ client: sonarrClientRaw });
      // If we get any result without error, the connection is working
      return result !== null && result !== undefined;
    } catch (error) {
      console.error(`Sonarr ${instance.name} connection test failed:`, error);
      return false;
    }
  }
}

export const sonarrApiClient = new SonarrApiClient();
