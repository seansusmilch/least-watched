// DEPRECATED: This legacy API client is being phased out
// Use the new generated API clients in @/lib/services/arr-client.ts instead
// Only Emby-related functionality should remain here until Emby client is generated
// API service functions for Emby integration
import { embySettingsService } from './database';
import { EmbySettings } from './utils/single-emby-settings';

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

interface ApiConfig {
  emby: EmbySettings | null;
}

class ApiService {
  private config: ApiConfig | null = null;

  // Load configuration from database
  async loadConfig(): Promise<void> {
    try {
      const embySettings = await embySettingsService.getEnabled();

      this.config = {
        emby: embySettings || null,
      };
    } catch (error) {
      console.error('Failed to load configuration from database:', error);
      this.config = { emby: null };
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

export { ApiService };
export type { ApiConfig };
