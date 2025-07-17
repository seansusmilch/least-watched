import type { ServiceSettings } from '../utils/prefixed-settings';

export interface RootFolderInfo {
  path: string;
  freeSpace: number;
  totalSpace?: number;
}

export interface DiskSpaceInfo {
  path: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
  percentUsed?: number;
  driveFormat?: string;
  unmappedFolders?: Array<{
    name: string;
    path: string;
    size: number;
  }>;
}

export interface RadarrMovie {
  id: number;
  title: string;
  path: string;
  sizeOnDisk?: number;
  movieFile?: {
    quality?: {
      quality?: {
        name: string;
      };
    };
  };
}

abstract class BaseApiClient {
  protected async fetchWithAuth(
    url: string,
    apiKey: string
  ): Promise<Response> {
    return fetch(url, {
      headers: { 'X-Api-Key': apiKey },
    });
  }

  protected async safeApiCall<T>(
    apiCall: () => Promise<Response>,
    defaultValue: T,
    context: string
  ): Promise<T> {
    try {
      const response = await apiCall();
      if (!response.ok) {
        console.warn(`${context}: API returned ${response.status}`);
        return defaultValue;
      }
      return await response.json();
    } catch (error) {
      console.error(`${context}:`, error);
      return defaultValue;
    }
  }
}

export class SonarrApiClient extends BaseApiClient {
  async getRootFolders(instance: ServiceSettings): Promise<RootFolderInfo[]> {
    return this.safeApiCall(
      () =>
        this.fetchWithAuth(
          `${instance.url}/api/v3/rootfolder`,
          instance.apiKey
        ),
      [],
      `Sonarr ${instance.name} root folders`
    );
  }

  async getDiskSpace(instance: ServiceSettings): Promise<DiskSpaceInfo[]> {
    return this.safeApiCall(
      () =>
        this.fetchWithAuth(`${instance.url}/api/v3/diskspace`, instance.apiKey),
      [],
      `Sonarr ${instance.name} disk space`
    );
  }
}

export class RadarrApiClient extends BaseApiClient {
  async getRootFolders(instance: ServiceSettings): Promise<RootFolderInfo[]> {
    return this.safeApiCall(
      () =>
        this.fetchWithAuth(
          `${instance.url}/api/v3/rootfolder`,
          instance.apiKey
        ),
      [],
      `Radarr ${instance.name} root folders`
    );
  }

  async getDiskSpace(instance: ServiceSettings): Promise<DiskSpaceInfo[]> {
    return this.safeApiCall(
      () =>
        this.fetchWithAuth(`${instance.url}/api/v3/diskspace`, instance.apiKey),
      [],
      `Radarr ${instance.name} disk space`
    );
  }

  async getMovies(instance: ServiceSettings): Promise<RadarrMovie[]> {
    return this.safeApiCall(
      () => this.fetchWithAuth(`${instance.url}/api/v3/movie`, instance.apiKey),
      [],
      `Radarr ${instance.name} movies`
    );
  }
}

export const sonarrApiClient = new SonarrApiClient();
export const radarrApiClient = new RadarrApiClient();
