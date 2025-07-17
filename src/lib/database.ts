import { PrismaClient } from '../generated/prisma';
import { prefixedSettingsService } from './utils/prefixed-settings';

// Global instance to avoid multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Sonarr Settings (now using prefixed settings)
export const sonarrSettingsService = {
  async getAll() {
    return await prefixedSettingsService.getAll('sonarr');
  },

  async getById(id: string) {
    return await prefixedSettingsService.getById('sonarr', id);
  },

  async getByName(name: string) {
    return await prefixedSettingsService.getByName('sonarr', name);
  },

  async create(data: {
    name: string;
    url: string;
    apiKey: string;
    enabled?: boolean;
    selectedFolders?: string[];
  }) {
    return await prefixedSettingsService.create('sonarr', data);
  },

  async update(
    id: string,
    data: {
      name?: string;
      url?: string;
      apiKey?: string;
      enabled?: boolean;
      selectedFolders?: string[];
    }
  ) {
    return await prefixedSettingsService.update('sonarr', id, data);
  },

  async delete(id: string) {
    return await prefixedSettingsService.delete('sonarr', id);
  },

  async getEnabled() {
    return await prefixedSettingsService.getEnabled('sonarr');
  },
};

// Radarr Settings (now using prefixed settings)
export const radarrSettingsService = {
  async getAll() {
    return await prefixedSettingsService.getAll('radarr');
  },

  async getById(id: string) {
    return await prefixedSettingsService.getById('radarr', id);
  },

  async getByName(name: string) {
    return await prefixedSettingsService.getByName('radarr', name);
  },

  async create(data: {
    name: string;
    url: string;
    apiKey: string;
    enabled?: boolean;
    selectedFolders?: string[];
  }) {
    return await prefixedSettingsService.create('radarr', data);
  },

  async update(
    id: string,
    data: {
      name?: string;
      url?: string;
      apiKey?: string;
      enabled?: boolean;
      selectedFolders?: string[];
    }
  ) {
    return await prefixedSettingsService.update('radarr', id, data);
  },

  async delete(id: string) {
    return await prefixedSettingsService.delete('radarr', id);
  },

  async getEnabled() {
    return await prefixedSettingsService.getEnabled('radarr');
  },
};

// Emby Settings (now using prefixed settings)
export const embySettingsService = {
  async getAll() {
    return await prefixedSettingsService.getAll('emby');
  },

  async getById(id: string) {
    return await prefixedSettingsService.getById('emby', id);
  },

  async getByName(name: string) {
    return await prefixedSettingsService.getByName('emby', name);
  },

  async create(data: {
    name: string;
    url: string;
    apiKey: string;
    userId?: string;
    enabled?: boolean;
    selectedFolders?: string[];
    preferEmbyDateAdded?: boolean;
  }) {
    return await prefixedSettingsService.create('emby', data);
  },

  async update(
    id: string,
    data: {
      name?: string;
      url?: string;
      apiKey?: string;
      userId?: string;
      enabled?: boolean;
      selectedFolders?: string[];
      preferEmbyDateAdded?: boolean;
    }
  ) {
    return await prefixedSettingsService.update('emby', id, data);
  },

  async delete(id: string) {
    return await prefixedSettingsService.delete('emby', id);
  },

  async getEnabled() {
    return await prefixedSettingsService.getEnabled('emby');
  },
};

// App Settings
export const appSettingsService = {
  async getAll() {
    return await prisma.appSettings.findMany({
      orderBy: { key: 'asc' },
    });
  },

  async getByKey(key: string) {
    return await prisma.appSettings.findUnique({
      where: { key },
    });
  },

  async getValue(key: string, defaultValue?: string) {
    const setting = await prisma.appSettings.findUnique({
      where: { key },
    });
    return setting?.value ?? defaultValue;
  },

  async setValue(key: string, value: string, description?: string) {
    return await prisma.appSettings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  },

  async delete(key: string) {
    return await prisma.appSettings.delete({
      where: { key },
    });
  },
};

// Database connection management
export const database = {
  async connect() {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  },

  async disconnect() {
    try {
      await prisma.$disconnect();
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Database disconnection failed:', error);
      throw error;
    }
  },

  async healthCheck() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  },
};
