import type { ServiceSettings } from '@/lib/utils/prefixed-settings';
import { client as radarrClientRaw } from '@/generated/radarr/client.gen';
import {
  getApiV3Rootfolder as getRadarrRootfolder,
  getApiV3Diskspace as getRadarrDiskspace,
  getApiV3Movie as getRadarrMovie,
  getApiV3MovieById as getRadarrMovieById,
  getApiV3SystemStatus as getRadarrSystemStatus,
  deleteApiV3MovieById as deleteRadarrMovieById,
} from '@/generated/radarr/sdk.gen';
import type {
  RootFolderResource as RadarrRootFolderResource,
  DiskSpaceResource as RadarrDiskSpaceResource,
  MovieResource as RadarrMovieResource,
} from '@/generated/radarr/types.gen';
import {
  safeApiCall,
  DEFAULT_TIMEOUT,
  createFetchWithTimeout,
} from './shared/api-utils';

export type RadarrMovie = RadarrMovieResource;
export type RadarrRootFolder = RadarrRootFolderResource;
export type RadarrDiskSpace = RadarrDiskSpaceResource;

export class RadarrApiClient {
  private configureClient(instance: ServiceSettings) {
    radarrClientRaw.setConfig({
      baseUrl: instance.url,
      headers: { 'X-Api-Key': instance.apiKey },
      fetch: createFetchWithTimeout(DEFAULT_TIMEOUT),
    });
  }

  async getRootFolders(
    instance: ServiceSettings
  ): Promise<RadarrRootFolderResource[]> {
    this.configureClient(instance);
    return safeApiCall(
      () => getRadarrRootfolder({ client: radarrClientRaw }),
      [],
      `Radarr ${instance.name} root folders`
    );
  }

  async getDiskSpace(
    instance: ServiceSettings
  ): Promise<RadarrDiskSpaceResource[]> {
    this.configureClient(instance);
    return safeApiCall(
      () => getRadarrDiskspace({ client: radarrClientRaw }),
      [],
      `Radarr ${instance.name} disk space`
    );
  }

  async getMovies(instance: ServiceSettings): Promise<RadarrMovieResource[]> {
    this.configureClient(instance);
    return safeApiCall(
      () => getRadarrMovie({ client: radarrClientRaw }),
      [],
      `Radarr ${instance.name} movies`
    );
  }

  async getMovieById(
    instance: ServiceSettings,
    id: number
  ): Promise<RadarrMovieResource | null> {
    this.configureClient(instance);
    return safeApiCall(
      () => getRadarrMovieById({ client: radarrClientRaw, path: { id } }),
      null,
      `Radarr ${instance.name} movie by ID ${id}`
    );
  }

  async testConnection(instance: ServiceSettings): Promise<boolean> {
    this.configureClient(instance);
    try {
      const result = await getRadarrSystemStatus({ client: radarrClientRaw });
      // If we get any result without error, the connection is working
      return result !== null && result !== undefined;
    } catch (error) {
      console.error(`Radarr ${instance.name} connection test failed:`, error);
      return false;
    }
  }

  async deleteMovie(
    instance: ServiceSettings,
    id: number,
    {
      deleteFiles = false,
      addImportExclusion = false,
    }: { deleteFiles?: boolean; addImportExclusion?: boolean }
  ) {
    this.configureClient(instance);
    return safeApiCall(
      () =>
        deleteRadarrMovieById({
          client: radarrClientRaw,
          path: { id },
          query: { deleteFiles, addImportExclusion },
        }),
      undefined,
      `Radarr ${instance.name} movie by ID ${id}`
    );
  }
}

export const radarrApiClient = new RadarrApiClient();
