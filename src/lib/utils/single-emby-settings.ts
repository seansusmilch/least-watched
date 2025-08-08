import { kvSettingsStore } from '@/lib/utils/kv-settings';

export interface EmbySettings {
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  // New canonical field
  selectedLibraries?: string[];
  // Backward compatibility
  selectedFolders?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateEmbySettingsInput {
  name: string;
  url: string;
  apiKey: string;
  enabled?: boolean;
  selectedLibraries?: string[];
  selectedFolders?: string[];
}

export interface UpdateEmbySettingsInput {
  name?: string;
  url?: string;
  apiKey?: string;
  enabled?: boolean;
  selectedLibraries?: string[];
  selectedFolders?: string[];
}

export const singleEmbySettingsService = {
  // Get the single Emby instance
  async get(): Promise<EmbySettings | null> {
    try {
      const [
        name,
        url,
        apiKey,
        enabled,
        selectedLibrariesStr,
        selectedFoldersStr,
      ] = await Promise.all([
        kvSettingsStore.get('emby-name'),
        kvSettingsStore.get('emby-url'),
        kvSettingsStore.get('emby-apiKey'),
        kvSettingsStore.get('emby-enabled'),
        kvSettingsStore.get('emby-selectedLibraries'),
        kvSettingsStore.get('emby-selectedFolders'),
      ]);

      if (!name || !url || !apiKey) {
        return null;
      }

      let parsedSelectedLibraries: string[] | undefined;
      let parsedSelectedFolders: string[] | undefined;
      try {
        parsedSelectedLibraries = selectedLibrariesStr
          ? JSON.parse(selectedLibrariesStr)
          : undefined;
      } catch {
        parsedSelectedLibraries = undefined;
      }
      try {
        parsedSelectedFolders = selectedFoldersStr
          ? JSON.parse(selectedFoldersStr)
          : undefined;
      } catch {
        parsedSelectedFolders = undefined;
      }

      return {
        name,
        url,
        apiKey,
        enabled: enabled === 'true',
        selectedLibraries: parsedSelectedLibraries ?? parsedSelectedFolders,
        selectedFolders: parsedSelectedFolders,
      };
    } catch (error) {
      console.error('Failed to get Emby settings:', error);
      return null;
    }
  },

  // Check if Emby instance exists
  async exists(): Promise<boolean> {
    const settings = await this.get();
    return settings !== null;
  },

  // Create a new Emby instance (only if none exists)
  async create(data: CreateEmbySettingsInput): Promise<EmbySettings> {
    const existing = await this.exists();
    if (existing) {
      throw new Error(
        'Emby instance already exists. Only one instance is supported.'
      );
    }

    const settingsToCreate = [
      {
        key: 'emby-name',
        value: data.name,
        description: 'Emby server name',
      },
      {
        key: 'emby-url',
        value: data.url,
        description: 'Emby server URL',
      },
      {
        key: 'emby-apiKey',
        value: data.apiKey,
        description: 'Emby API key',
      },
      {
        key: 'emby-enabled',
        value: (data.enabled ?? true).toString(),
        description: 'Emby server enabled status',
      },
    ];

    // Prefer writing libraries; keep folders if provided for compatibility
    if (data.selectedLibraries && data.selectedLibraries.length > 0) {
      settingsToCreate.push({
        key: 'emby-selectedLibraries',
        value: JSON.stringify(data.selectedLibraries),
        description: 'Emby selected libraries',
      });
    } else if (data.selectedFolders && data.selectedFolders.length > 0) {
      settingsToCreate.push({
        key: 'emby-selectedFolders',
        value: JSON.stringify(data.selectedFolders),
        description: 'Emby selected folders',
      });
    }

    // Create all settings
    await Promise.all(
      settingsToCreate.map((setting) =>
        kvSettingsStore.set(setting.key, setting.value, setting.description)
      )
    );

    return {
      name: data.name,
      url: data.url,
      apiKey: data.apiKey,
      enabled: data.enabled ?? true,
      selectedFolders: data.selectedFolders,
    };
  },

  // Update the Emby instance
  async update(data: UpdateEmbySettingsInput): Promise<EmbySettings> {
    const existing = await this.exists();
    if (!existing) {
      throw new Error('No Emby instance found to update');
    }

    const updates: Array<{ key: string; value: string; description: string }> =
      [];

    if (data.name !== undefined) {
      updates.push({
        key: 'emby-name',
        value: data.name,
        description: 'Emby server name',
      });
    }

    if (data.url !== undefined) {
      updates.push({
        key: 'emby-url',
        value: data.url,
        description: 'Emby server URL',
      });
    }

    if (data.apiKey !== undefined) {
      updates.push({
        key: 'emby-apiKey',
        value: data.apiKey,
        description: 'Emby API key',
      });
    }

    if (data.enabled !== undefined) {
      updates.push({
        key: 'emby-enabled',
        value: data.enabled.toString(),
        description: 'Emby server enabled status',
      });
    }

    // Update libraries if provided; also allow legacy folders
    if (data.selectedLibraries !== undefined) {
      if (data.selectedLibraries && data.selectedLibraries.length > 0) {
        updates.push({
          key: 'emby-selectedLibraries',
          value: JSON.stringify(data.selectedLibraries),
          description: 'Emby selected libraries',
        });
      } else {
        await kvSettingsStore.delete('emby-selectedLibraries').catch(() => {});
      }
    }
    if (data.selectedFolders !== undefined) {
      if (data.selectedFolders && data.selectedFolders.length > 0) {
        updates.push({
          key: 'emby-selectedFolders',
          value: JSON.stringify(data.selectedFolders),
          description: 'Emby selected folders',
        });
      } else {
        await kvSettingsStore.delete('emby-selectedFolders').catch(() => {});
      }
    }

    // Apply all updates
    await Promise.all(
      updates.map((update) =>
        kvSettingsStore.set(update.key, update.value, update.description)
      )
    );

    // Return updated settings
    const updated = await this.get();
    if (!updated) {
      throw new Error('Failed to retrieve updated Emby settings');
    }

    return updated;
  },

  // Delete the Emby instance
  async delete(): Promise<void> {
    const keys = [
      'emby-name',
      'emby-url',
      'emby-apiKey',
      'emby-enabled',
      'emby-selectedLibraries',
      'emby-selectedFolders',
    ];

    await Promise.all(
      keys.map((key) =>
        kvSettingsStore.delete(key).catch(() => {
          // Ignore errors for keys that don't exist
        })
      )
    );
  },

  // Get enabled status (convenience method)
  async getEnabled(): Promise<EmbySettings | null> {
    const settings = await this.get();
    return settings && settings.enabled ? settings : null;
  },
};
