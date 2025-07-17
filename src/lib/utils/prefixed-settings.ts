import { appSettingsService } from '../database';

export type ServiceType = 'sonarr' | 'radarr' | 'emby';

export interface ServiceSettings {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  selectedFolders?: string[];
  userId?: string; // Only for Emby
  preferEmbyDateAdded?: boolean; // Only for Emby
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceSettingsInput {
  name: string;
  url: string;
  apiKey: string;
  enabled?: boolean;
  selectedFolders?: string[];
  userId?: string; // Only for Emby
  preferEmbyDateAdded?: boolean; // Only for Emby
}

export interface UpdateServiceSettingsInput {
  name?: string;
  url?: string;
  apiKey?: string;
  enabled?: boolean;
  selectedFolders?: string[];
  userId?: string; // Only for Emby
  preferEmbyDateAdded?: boolean; // Only for Emby
}

// Utility functions for managing prefixed settings
export const prefixedSettingsService = {
  // Get all instances of a service type
  async getAll(serviceType: ServiceType): Promise<ServiceSettings[]> {
    const prefix = `${serviceType}-`;
    const allSettings = await appSettingsService.getAll();

    // Group settings by instance ID
    const instanceMap = new Map<string, Partial<ServiceSettings>>();

    allSettings
      .filter((setting) => setting.key.startsWith(prefix))
      .forEach((setting) => {
        const keyParts = setting.key.split('-');
        if (keyParts.length >= 3) {
          const instanceId = keyParts[1];
          const fieldName = keyParts.slice(2).join('-');

          if (!instanceMap.has(instanceId)) {
            instanceMap.set(instanceId, { id: instanceId });
          }

          const instance = instanceMap.get(instanceId)!;

          switch (fieldName) {
            case 'name':
              instance.name = setting.value;
              break;
            case 'url':
              instance.url = setting.value;
              break;
            case 'apiKey':
              instance.apiKey = setting.value;
              break;
            case 'enabled':
              instance.enabled = setting.value === 'true';
              break;
            case 'selectedFolders':
              instance.selectedFolders = setting.value
                ? JSON.parse(setting.value)
                : undefined;
              break;
            case 'userId':
              instance.userId = setting.value;
              break;
            case 'preferEmbyDateAdded':
              instance.preferEmbyDateAdded = setting.value === 'true';
              break;
          }

          // Use the earliest createdAt and latest updatedAt
          if (!instance.createdAt || setting.createdAt < instance.createdAt) {
            instance.createdAt = setting.createdAt;
          }
          if (!instance.updatedAt || setting.updatedAt > instance.updatedAt) {
            instance.updatedAt = setting.updatedAt;
          }
        }
      });

    return Array.from(instanceMap.values())
      .filter((instance) => instance.name && instance.url && instance.apiKey)
      .map((instance) => ({
        id: instance.id!,
        name: instance.name!,
        url: instance.url!,
        apiKey: instance.apiKey!,
        enabled: instance.enabled ?? true,
        selectedFolders: instance.selectedFolders,
        userId: instance.userId,
        preferEmbyDateAdded: instance.preferEmbyDateAdded,
        createdAt: instance.createdAt!,
        updatedAt: instance.updatedAt!,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  // Get a specific instance by ID
  async getById(
    serviceType: ServiceType,
    id: string
  ): Promise<ServiceSettings | null> {
    const prefix = `${serviceType}-${id}-`;
    const allSettings = await appSettingsService.getAll();

    const instanceSettings = allSettings.filter((setting) =>
      setting.key.startsWith(prefix)
    );

    if (instanceSettings.length === 0) {
      return null;
    }

    const instance: Partial<ServiceSettings> = { id };
    let createdAt = new Date();
    let updatedAt = new Date(0);

    instanceSettings.forEach((setting) => {
      const fieldName = setting.key.replace(prefix, '');

      switch (fieldName) {
        case 'name':
          instance.name = setting.value;
          break;
        case 'url':
          instance.url = setting.value;
          break;
        case 'apiKey':
          instance.apiKey = setting.value;
          break;
        case 'enabled':
          instance.enabled = setting.value === 'true';
          break;
        case 'selectedFolders':
          instance.selectedFolders = setting.value
            ? JSON.parse(setting.value)
            : undefined;
          break;
        case 'userId':
          instance.userId = setting.value;
          break;
        case 'preferEmbyDateAdded':
          instance.preferEmbyDateAdded = setting.value === 'true';
          break;
      }

      if (setting.createdAt < createdAt) {
        createdAt = setting.createdAt;
      }
      if (setting.updatedAt > updatedAt) {
        updatedAt = setting.updatedAt;
      }
    });

    if (!instance.name || !instance.url || !instance.apiKey) {
      return null;
    }

    return {
      id: instance.id!,
      name: instance.name!,
      url: instance.url!,
      apiKey: instance.apiKey!,
      enabled: instance.enabled ?? true,
      selectedFolders: instance.selectedFolders,
      userId: instance.userId,
      preferEmbyDateAdded: instance.preferEmbyDateAdded,
      createdAt,
      updatedAt,
    };
  },

  // Get instance by name
  async getByName(
    serviceType: ServiceType,
    name: string
  ): Promise<ServiceSettings | null> {
    const instances = await this.getAll(serviceType);
    return instances.find((instance) => instance.name === name) || null;
  },

  // Create a new instance
  async create(
    serviceType: ServiceType,
    data: CreateServiceSettingsInput
  ): Promise<ServiceSettings> {
    const instanceId = generateUniqueId();
    const prefix = `${serviceType}-${instanceId}-`;
    const now = new Date();

    const settingsToCreate = [
      {
        key: `${prefix}name`,
        value: data.name,
        description: `${serviceType} instance name`,
      },
      {
        key: `${prefix}url`,
        value: data.url,
        description: `${serviceType} server URL`,
      },
      {
        key: `${prefix}apiKey`,
        value: data.apiKey,
        description: `${serviceType} API key`,
      },
      {
        key: `${prefix}enabled`,
        value: (data.enabled ?? true).toString(),
        description: `${serviceType} instance enabled status`,
      },
    ];

    if (data.selectedFolders && data.selectedFolders.length > 0) {
      settingsToCreate.push({
        key: `${prefix}selectedFolders`,
        value: JSON.stringify(data.selectedFolders),
        description: `${serviceType} selected folders`,
      });
    }

    if (data.userId) {
      settingsToCreate.push({
        key: `${prefix}userId`,
        value: data.userId,
        description: `${serviceType} user ID`,
      });
    }

    if (serviceType === 'emby' && data.preferEmbyDateAdded !== undefined) {
      settingsToCreate.push({
        key: `${prefix}preferEmbyDateAdded`,
        value: data.preferEmbyDateAdded.toString(),
        description: `${serviceType} prefer Emby date added`,
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
      id: instanceId,
      name: data.name,
      url: data.url,
      apiKey: data.apiKey,
      enabled: data.enabled ?? true,
      selectedFolders: data.selectedFolders,
      userId: data.userId,
      preferEmbyDateAdded: data.preferEmbyDateAdded,
      createdAt: now,
      updatedAt: now,
    };
  },

  // Update an existing instance
  async update(
    serviceType: ServiceType,
    id: string,
    data: UpdateServiceSettingsInput
  ): Promise<ServiceSettings> {
    const prefix = `${serviceType}-${id}-`;

    const updates: Promise<unknown>[] = [];

    if (data.name !== undefined) {
      updates.push(
        appSettingsService.setValue(
          `${prefix}name`,
          data.name,
          `${serviceType} instance name`
        )
      );
    }

    if (data.url !== undefined) {
      updates.push(
        appSettingsService.setValue(
          `${prefix}url`,
          data.url,
          `${serviceType} server URL`
        )
      );
    }

    if (data.apiKey !== undefined) {
      updates.push(
        appSettingsService.setValue(
          `${prefix}apiKey`,
          data.apiKey,
          `${serviceType} API key`
        )
      );
    }

    if (data.enabled !== undefined) {
      updates.push(
        appSettingsService.setValue(
          `${prefix}enabled`,
          data.enabled.toString(),
          `${serviceType} instance enabled status`
        )
      );
    }

    if (data.selectedFolders !== undefined) {
      if (data.selectedFolders && data.selectedFolders.length > 0) {
        updates.push(
          appSettingsService.setValue(
            `${prefix}selectedFolders`,
            JSON.stringify(data.selectedFolders),
            `${serviceType} selected folders`
          )
        );
      } else {
        updates.push(
          appSettingsService.delete(`${prefix}selectedFolders`).catch(() => {})
        ); // Ignore if doesn't exist
      }
    }

    if (data.userId !== undefined) {
      if (data.userId) {
        updates.push(
          appSettingsService.setValue(
            `${prefix}userId`,
            data.userId,
            `${serviceType} user ID`
          )
        );
      } else {
        updates.push(
          appSettingsService.delete(`${prefix}userId`).catch(() => {})
        ); // Ignore if doesn't exist
      }
    }

    if (data.preferEmbyDateAdded !== undefined) {
      if (serviceType === 'emby') {
        updates.push(
          appSettingsService.setValue(
            `${prefix}preferEmbyDateAdded`,
            data.preferEmbyDateAdded.toString(),
            `${serviceType} prefer Emby date added`
          )
        );
      }
    }

    await Promise.all(updates);

    const updated = await this.getById(serviceType, id);
    if (!updated) {
      throw new Error(`Failed to update ${serviceType} instance with ID ${id}`);
    }

    return updated;
  },

  // Delete an instance
  async delete(serviceType: ServiceType, id: string): Promise<void> {
    const prefix = `${serviceType}-${id}-`;
    const allSettings = await appSettingsService.getAll();

    const keysToDelete = allSettings
      .filter((setting) => setting.key.startsWith(prefix))
      .map((setting) => setting.key);

    await Promise.all(
      keysToDelete.map((key) => appSettingsService.delete(key))
    );
  },

  // Get only enabled instances
  async getEnabled(serviceType: ServiceType): Promise<ServiceSettings[]> {
    const all = await this.getAll(serviceType);
    return all.filter((instance) => instance.enabled);
  },
};

// Generate a unique ID for new instances
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
