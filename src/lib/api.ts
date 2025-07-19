// API service functions for media management integrations
import {
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
} from './database';
import { EmbySettings } from './utils/single-emby-settings';
import { ServiceSettings } from './utils/prefixed-settings';
// Type definitions for API responses
interface EmbyLibrary {
  Name: string;
  Id: string;
  CollectionType: string;
  ItemId: string;
}

interface EmbyPlaybackInfo {
  lastPlayedDate?: string;
  playCount?: number;
  isFavorite?: boolean;
}

interface SonarrSeries {
  id: number;
  title: string;
  year: number;
  added: string;
  path: string;
  sizeOnDisk: number;
  tvdbId: number;
  tmdbId?: number;
  seasons?: {
    statistics?: {
      episodeFileCount: number;
    };
  }[];
  images?: {
    coverType: string;
    url: string;
  }[];
}

interface RadarrMovie {
  id: number;
  title: string;
  year: number;
  added: string;
  path: string;
  sizeOnDisk: number;
  tmdbId: number;
  imdbId?: string;
  movieFile?: {
    quality?: {
      quality?: {
        name: string;
      };
    };
  };
  images?: {
    coverType: string;
    url: string;
  }[];
}

interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  year: number;
  dateAdded: string;
  lastWatched: string | null;
  fileSize: number;
  quality: string;
  path: string;
  poster?: string;
  unwatchedDays: number;
  imdbId?: string;
  tmdbId?: string;
}

interface ApiConfig {
  emby: EmbySettings | null;
  sonarr: ServiceSettings[];
  radarr: ServiceSettings[];
}

class ApiService {
  private config: ApiConfig | null = null;

  // Load configuration from database
  async loadConfig(): Promise<void> {
    try {
      const [embySettings, sonarrSettings, radarrSettings] = await Promise.all([
        embySettingsService.getEnabled(),
        sonarrSettingsService.getEnabled(),
        radarrSettingsService.getEnabled(),
      ]);

      this.config = {
        emby: embySettings || null,
        sonarr: sonarrSettings,
        radarr: radarrSettings,
      };
    } catch (error) {
      console.error('Failed to load configuration from database:', error);
      this.config = { emby: null, sonarr: [], radarr: [] };
    }
  }

  private async ensureConfig(): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }
  }

  // Emby API methods
  async testEmbyConnection(): Promise<boolean> {
    await this.ensureConfig();
    if (!this.config?.emby) return false;

    try {
      const embyConfig = this.config.emby;
      const response = await fetch(
        `${embyConfig.url}/System/Info?api_key=${embyConfig.apiKey}`
      );
      return response.ok;
    } catch (error) {
      console.error('Emby connection test failed:', error);
      return false;
    }
  }

  async getEmbyLibraries(): Promise<EmbyLibrary[]> {
    await this.ensureConfig();
    if (!this.config?.emby) return [];

    try {
      const embyConfig = this.config.emby;
      const response = await fetch(
        `${embyConfig.url}/Library/VirtualFolders?api_key=${embyConfig.apiKey}`
      );
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Failed to get Emby libraries:', error);
      return [];
    }
  }

  async getEmbyPlaybackInfo(itemId: string): Promise<EmbyPlaybackInfo | null> {
    await this.ensureConfig();
    if (!this.config?.emby) return null;

    try {
      const embyConfig = this.config.emby;
      const response = await fetch(
        `${embyConfig.url}/UserData/${itemId}?api_key=${embyConfig.apiKey}`
      );
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Failed to get Emby playback info:', error);
      return null;
    }
  }

  // Sonarr API methods
  async testSonarrConnection(configIndex: number = 0): Promise<boolean> {
    await this.ensureConfig();
    if (!this.config?.sonarr[configIndex]) return false;

    try {
      const sonarrConfig = this.config.sonarr[configIndex];
      const response = await fetch(`${sonarrConfig.url}/api/v3/system/status`, {
        headers: {
          'X-Api-Key': sonarrConfig.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Sonarr connection test failed:', error);
      return false;
    }
  }

  async getSonarrSeries(configIndex: number = 0): Promise<SonarrSeries[]> {
    await this.ensureConfig();
    if (!this.config?.sonarr[configIndex]) return [];

    try {
      const sonarrConfig = this.config.sonarr[configIndex];
      const response = await fetch(`${sonarrConfig.url}/api/v3/series`, {
        headers: {
          'X-Api-Key': sonarrConfig.apiKey,
        },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Failed to get Sonarr series:', error);
      return [];
    }
  }

  async getSonarrHistory(
    seriesId?: number,
    configIndex: number = 0
  ): Promise<unknown[]> {
    await this.ensureConfig();
    if (!this.config?.sonarr[configIndex]) return [];

    try {
      const sonarrConfig = this.config.sonarr[configIndex];
      const url = seriesId
        ? `${sonarrConfig.url}/api/v3/history?seriesId=${seriesId}`
        : `${sonarrConfig.url}/api/v3/history`;

      const response = await fetch(url, {
        headers: {
          'X-Api-Key': sonarrConfig.apiKey,
        },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Failed to get Sonarr history:', error);
      return [];
    }
  }

  // Radarr API methods
  async testRadarrConnection(configIndex: number = 0): Promise<boolean> {
    await this.ensureConfig();
    if (!this.config?.radarr[configIndex]) return false;

    try {
      const radarrConfig = this.config.radarr[configIndex];
      const response = await fetch(`${radarrConfig.url}/api/v3/system/status`, {
        headers: {
          'X-Api-Key': radarrConfig.apiKey,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Radarr connection test failed:', error);
      return false;
    }
  }

  async getRadarrMovies(configIndex: number = 0): Promise<RadarrMovie[]> {
    await this.ensureConfig();
    if (!this.config?.radarr[configIndex]) return [];

    try {
      const radarrConfig = this.config.radarr[configIndex];
      const response = await fetch(`${radarrConfig.url}/api/v3/movie`, {
        headers: {
          'X-Api-Key': radarrConfig.apiKey,
        },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Failed to get Radarr movies:', error);
      return [];
    }
  }

  async getRadarrHistory(
    movieId?: number,
    configIndex: number = 0
  ): Promise<unknown[]> {
    await this.ensureConfig();
    if (!this.config?.radarr[configIndex]) return [];

    try {
      const radarrConfig = this.config.radarr[configIndex];
      const url = movieId
        ? `${radarrConfig.url}/api/v3/history?movieId=${movieId}`
        : `${radarrConfig.url}/api/v3/history`;

      const response = await fetch(url, {
        headers: {
          'X-Api-Key': radarrConfig.apiKey,
        },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error('Failed to get Radarr history:', error);
      return [];
    }
  }

  // Combined scan functionality with multiple instances support
  async scanLibrary(
    settings: {
      unwatchedThreshold: number;
      recentlyAddedThreshold: number;
      includeMovies: boolean;
      includeTvShows: boolean;
    },
    onProgress?: (progress: {
      phase: string;
      current: number;
      total: number;
      currentItem: string;
    }) => void
  ): Promise<MediaItem[]> {
    await this.ensureConfig();
    if (!this.config) return [];

    const allMediaItems: MediaItem[] = [];
    let totalPhases = 0;
    let currentPhase = 0;

    // Calculate total phases
    if (settings.includeMovies) totalPhases += this.config.radarr.length;
    if (settings.includeTvShows) totalPhases += this.config.sonarr.length;

    // Scan all Radarr instances
    if (settings.includeMovies) {
      for (let i = 0; i < this.config.radarr.length; i++) {
        currentPhase++;
        onProgress?.({
          phase: `Scanning Radarr instance ${i + 1}/${
            this.config.radarr.length
          }`,
          current: currentPhase,
          total: totalPhases,
          currentItem: 'Fetching movies...',
        });

        try {
          const movies = await this.getRadarrMovies(i);
          // Transform movies to MediaItem format
          const mediaItems = movies.map((movie) =>
            this.transformRadarrMovie(movie)
          );
          allMediaItems.push(...mediaItems);
        } catch (error) {
          console.error(`Failed to scan Radarr instance ${i + 1}:`, error);
        }
      }
    }

    // Scan all Sonarr instances
    if (settings.includeTvShows) {
      for (let i = 0; i < this.config.sonarr.length; i++) {
        currentPhase++;
        onProgress?.({
          phase: `Scanning Sonarr instance ${i + 1}/${
            this.config.sonarr.length
          }`,
          current: currentPhase,
          total: totalPhases,
          currentItem: 'Fetching TV shows...',
        });

        try {
          const series = await this.getSonarrSeries(i);
          // Transform series to MediaItem format
          const mediaItems = series.map((show) =>
            this.transformSonarrSeries(show)
          );
          allMediaItems.push(...mediaItems);
        } catch (error) {
          console.error(`Failed to scan Sonarr instance ${i + 1}:`, error);
        }
      }
    }

    // Filter based on settings
    const filteredItems = filterMediaByThreshold(
      allMediaItems,
      settings.unwatchedThreshold,
      settings.recentlyAddedThreshold
    );

    return filteredItems;
  }

  private transformRadarrMovie(movie: RadarrMovie): MediaItem {
    return {
      id: `radarr-${movie.id}`,
      title: movie.title,
      type: 'movie',
      year: movie.year,
      dateAdded: movie.added,
      lastWatched: null, // Will be populated from Emby if available
      fileSize: movie.sizeOnDisk,
      quality: movie.movieFile?.quality?.quality?.name || 'Unknown',
      path: movie.path,
      poster: movie.images?.find((img) => img.coverType === 'poster')?.url,
      unwatchedDays: calculateDaysUnwatched(null, movie.added),
      imdbId: movie.imdbId,
      tmdbId: movie.tmdbId?.toString(),
    };
  }

  private transformSonarrSeries(series: SonarrSeries): MediaItem {
    return {
      id: `sonarr-${series.id}`,
      title: series.title,
      type: 'tv',
      year: series.year,
      dateAdded: series.added,
      lastWatched: null, // Will be populated from Emby if available
      fileSize: series.sizeOnDisk,
      quality: 'Unknown', // Sonarr doesn't provide quality info in the same way
      path: series.path,
      poster: series.images?.find((img) => img.coverType === 'poster')?.url,
      unwatchedDays: calculateDaysUnwatched(null, series.added),
      tmdbId: series.tmdbId?.toString(),
    };
  }

  // Refresh configuration (useful after settings changes)
  async refreshConfig(): Promise<void> {
    this.config = null;
    await this.loadConfig();
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Helper functions
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

export const calculateDaysUnwatched = (
  lastWatched: string | null,
  dateAdded: string
): number => {
  const now = new Date();
  const referenceDate = lastWatched
    ? new Date(lastWatched)
    : new Date(dateAdded);
  return Math.floor(
    (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
};

export const filterMediaByThreshold = (
  items: MediaItem[],
  unwatchedThreshold: number,
  recentlyAddedThreshold: number
): MediaItem[] => {
  return items.filter((item) => {
    const daysSinceAdded = calculateDaysUnwatched(null, item.dateAdded);
    const isRecentlyAdded = daysSinceAdded < recentlyAddedThreshold;
    const isUnwatched = item.unwatchedDays > unwatchedThreshold;

    return isUnwatched && !isRecentlyAdded;
  });
};

export { ApiService };
export type { MediaItem, ApiConfig };
