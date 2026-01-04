import type { ServiceSettings } from '@/lib/utils/prefixed-settings';
import { client as sonarrClientRaw } from '@/generated/sonarr/client.gen';
import {
  getApiV3Rootfolder as getSonarrRootfolder,
  getApiV3Diskspace as getSonarrDiskspace,
  getApiV3Series as getSonarrSeries,
  getApiV3SeriesById as getSonarrSeriesById,
  getApiV3SystemStatus as getSonarrSystemStatus,
  deleteApiV3SeriesById as deleteSonarrShowById,
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
import { eventsService } from './events-service';

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
      await eventsService.logError(
        'sonarr-api',
        `Sonarr ${instance.name} connection test failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  async deleteSeries(
    instance: ServiceSettings,
    id: number,
    {
      deleteFiles = false,
      addImportListExclusion = false,
    }: { deleteFiles?: boolean; addImportListExclusion?: boolean }
  ) {
    this.configureClient(instance);
    return safeApiCall(
      () =>
        deleteSonarrShowById({
          client: sonarrClientRaw,
          path: { id },
          query: { deleteFiles, addImportListExclusion },
        }),
      undefined,
      `Sonarr ${instance.name} series by ID ${id}`
    );
  }
}

export const sonarrApiClient = new SonarrApiClient();
