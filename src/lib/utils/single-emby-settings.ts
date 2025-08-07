import { appSettingsService } from '@/lib/database';

export interface EmbySettings {
  name: string;
  url: string;
  apiKey: string;
  userId?: string;
  enabled: boolean;
  selectedFolders?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateEmbySettingsInput {
  name: string;
  url: string;
  apiKey: string;
  userId?: string;
  enabled?: boolean;
  selectedFolders?: string[];
}

export interface UpdateEmbySettingsInput {
  name?: string;
  url?: string;
  apiKey?: string;
  userId?: string;
  enabled?: boolean;
  selectedFolders?: string[];
}

export const singleEmbySettingsService = {
  // Get the single Emby instance
  async get(): Promise<EmbySettings | null> {
    try {
      const [name, url, apiKey, enabled, userId, selectedFolders] =
        await Promise.all([
          appSettingsService.getValue('emby-name'),
          appSettingsService.getValue('emby-url'),
          appSettingsService.getValue('emby-apiKey'),
          appSettingsService.getValue('emby-enabled'),
          appSettingsService.getValue('emby-userId'),
          appSettingsService.getValue('emby-selectedFolders'),
        ]);

      if (!name || !url || !apiKey) {
        return null;
      }

      let parsedSelectedFolders: string[] | undefined;
      try {
        parsedSelectedFolders = selectedFolders
          ? JSON.parse(selectedFolders)
          : undefined;
      } catch {
        parsedSelectedFolders = undefined;
      }

      return {
        name,
        url,
        apiKey,
        userId: userId || undefined,
        enabled: enabled === 'true',
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

    // Add optional fields if they exist
    if (data.userId) {
      settingsToCreate.push({
        key: 'emby-userId',
        value: data.userId,
        description: 'Emby user ID',
      });
    }

    if (data.selectedFolders && data.selectedFolders.length > 0) {
      settingsToCreate.push({
        key: 'emby-selectedFolders',
        value: JSON.stringify(data.selectedFolders),
        description: 'Emby selected folders',
      });
    }

    // Create all settings
    await Promise.all(
      settingsToCreate.map((setting) =>
        appSettingsService.setValue(
          setting.key,
          setting.value,
          setting.description
        )
      )
    );

    return {
      name: data.name,
      url: data.url,
      apiKey: data.apiKey,
      userId: data.userId,
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

    if (data.userId !== undefined) {
      if (data.userId) {
        updates.push({
          key: 'emby-userId',
          value: data.userId,
          description: 'Emby user ID',
        });
      } else {
        // Remove userId if set to undefined/null (ignore if doesn't exist)
        await appSettingsService.delete('emby-userId').catch(() => {});
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
        // Remove selectedFolders if set to empty array (ignore if doesn't exist)
        await appSettingsService.delete('emby-selectedFolders').catch(() => {});
      }
    }

    // Apply all updates
    await Promise.all(
      updates.map((update) =>
        appSettingsService.setValue(
          update.key,
          update.value,
          update.description
        )
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
      'emby-userId',
      'emby-selectedFolders',
    ];

    await Promise.all(
      keys.map((key) =>
        appSettingsService.delete(key).catch(() => {
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
