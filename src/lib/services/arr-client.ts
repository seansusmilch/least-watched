import type { ServiceSettings } from '@/lib/utils/prefixed-settings';
import { client as sonarrClientRaw } from '@/generated/sonarr/client.gen';
import { client as radarrClientRaw } from '@/generated/radarr/client.gen';
import {
  getApiV3Rootfolder as getSonarrRootfolder,
  getApiV3Diskspace as getSonarrDiskspace,
  getApiV3Series as getSonarrSeries,
  getApiV3SeriesById as getSonarrSeriesById,
  getApiV3SystemStatus as getSonarrSystemStatus,
} from '@/generated/sonarr/sdk.gen';
import {
  getApiV3Rootfolder as getRadarrRootfolder,
  getApiV3Diskspace as getRadarrDiskspace,
  getApiV3Movie as getRadarrMovie,
  getApiV3MovieById as getRadarrMovieById,
  getApiV3SystemStatus as getRadarrSystemStatus,
} from '@/generated/radarr/sdk.gen';
import type {
  RootFolderResource as SonarrRootFolderResource,
  DiskSpaceResource as SonarrDiskSpaceResource,
  SeriesResource as SonarrSeriesResource,
} from '@/generated/sonarr/types.gen';
import type {
  RootFolderResource as RadarrRootFolderResource,
  DiskSpaceResource as RadarrDiskSpaceResource,
  MovieResource as RadarrMovieResource,
} from '@/generated/radarr/types.gen';

export type RootFolderInfo =
  | SonarrRootFolderResource
  | RadarrRootFolderResource;
export type DiskSpaceInfo = SonarrDiskSpaceResource | RadarrDiskSpaceResource;
export type RadarrMovie = RadarrMovieResource;
export type SonarrSeries = SonarrSeriesResource;

const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Helper function to configure and make API calls with error handling
async function safeApiCall<T>(
  apiCall: () => Promise<unknown>,
  defaultValue: T,
  context: string
): Promise<T> {
  try {
    const result = await apiCall();
    // Check if result has an error property (from RequestResult type)
    if (
      result &&
      typeof result === 'object' &&
      'error' in result &&
      result.error
    ) {
      console.warn(`${context}: API returned an error: ${result.error}`);
      return defaultValue;
    }
    // If data property exists, return it, otherwise return the result directly
    const finalResult =
      result && typeof result === 'object' && 'data' in result
        ? result.data
        : result;
    return finalResult as T;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`${context}:`, error);
    } else {
      console.warn(`${context}: Service unavailable, using default data`);
    }
    return defaultValue;
  }
}

export class SonarrApiClient {
  private configureClient(instance: ServiceSettings) {
    sonarrClientRaw.setConfig({
      baseUrl: instance.url,
      headers: { 'X-Api-Key': instance.apiKey },
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
        return fetch(input, { ...init, signal: controller.signal }).finally(
          () => clearTimeout(timeoutId)
        );
      },
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

export class RadarrApiClient {
  private configureClient(instance: ServiceSettings) {
    radarrClientRaw.setConfig({
      baseUrl: instance.url,
      headers: { 'X-Api-Key': instance.apiKey },
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
        return fetch(input, { ...init, signal: controller.signal }).finally(
          () => clearTimeout(timeoutId)
        );
      },
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
}

export const sonarrApiClient = new SonarrApiClient();
export const radarrApiClient = new RadarrApiClient();
