import { PrismaClient } from '../generated/prisma';

// Global instance to avoid multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Sonarr Settings
export const sonarrSettingsService = {
  async getAll() {
    return await prisma.sonarrSettings.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    return await prisma.sonarrSettings.findUnique({
      where: { id },
    });
  },

  async getByName(name: string) {
    return await prisma.sonarrSettings.findUnique({
      where: { name },
    });
  },

  async create(data: {
    name: string;
    url: string;
    apiKey: string;
    enabled?: boolean;
    selectedFolders?: string[];
  }) {
    return await prisma.sonarrSettings.create({
      data: {
        ...data,
        selectedFolders: data.selectedFolders
          ? JSON.stringify(data.selectedFolders)
          : null,
      },
    });
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
    return await prisma.sonarrSettings.update({
      where: { id },
      data: {
        ...data,
        selectedFolders:
          data.selectedFolders !== undefined
            ? data.selectedFolders
              ? JSON.stringify(data.selectedFolders)
              : null
            : undefined,
      },
    });
  },

  async delete(id: string) {
    return await prisma.sonarrSettings.delete({
      where: { id },
    });
  },

  async getEnabled() {
    return await prisma.sonarrSettings.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  },
};

// Radarr Settings
export const radarrSettingsService = {
  async getAll() {
    return await prisma.radarrSettings.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    return await prisma.radarrSettings.findUnique({
      where: { id },
    });
  },

  async getByName(name: string) {
    return await prisma.radarrSettings.findUnique({
      where: { name },
    });
  },

  async create(data: {
    name: string;
    url: string;
    apiKey: string;
    enabled?: boolean;
    selectedFolders?: string[];
  }) {
    return await prisma.radarrSettings.create({
      data: {
        ...data,
        selectedFolders: data.selectedFolders
          ? JSON.stringify(data.selectedFolders)
          : null,
      },
    });
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
    return await prisma.radarrSettings.update({
      where: { id },
      data: {
        ...data,
        selectedFolders:
          data.selectedFolders !== undefined
            ? data.selectedFolders
              ? JSON.stringify(data.selectedFolders)
              : null
            : undefined,
      },
    });
  },

  async delete(id: string) {
    return await prisma.radarrSettings.delete({
      where: { id },
    });
  },

  async getEnabled() {
    return await prisma.radarrSettings.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  },
};

// Emby Settings
export const embySettingsService = {
  async getAll() {
    return await prisma.embySettings.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    return await prisma.embySettings.findUnique({
      where: { id },
    });
  },

  async getByName(name: string) {
    return await prisma.embySettings.findUnique({
      where: { name },
    });
  },

  async create(data: {
    name: string;
    url: string;
    apiKey: string;
    userId?: string;
    enabled?: boolean;
    selectedFolders?: string[];
  }) {
    return await prisma.embySettings.create({
      data: {
        ...data,
        selectedFolders: data.selectedFolders
          ? JSON.stringify(data.selectedFolders)
          : null,
      },
    });
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
    }
  ) {
    return await prisma.embySettings.update({
      where: { id },
      data: {
        ...data,
        selectedFolders:
          data.selectedFolders !== undefined
            ? data.selectedFolders
              ? JSON.stringify(data.selectedFolders)
              : null
            : undefined,
      },
    });
  },

  async delete(id: string) {
    return await prisma.embySettings.delete({
      where: { id },
    });
  },

  async getEnabled() {
    return await prisma.embySettings.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
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

// Media Items
export const mediaItemsService = {
  async getAll() {
    return await prisma.mediaItem.findMany({
      orderBy: { title: 'asc' },
    });
  },

  async getById(id: string) {
    return await prisma.mediaItem.findUnique({
      where: { id },
    });
  },

  async getByType(type: 'movie' | 'tv') {
    return await prisma.mediaItem.findMany({
      where: { type },
      orderBy: { title: 'asc' },
    });
  },

  async getLeastWatched(limit: number = 50) {
    return await prisma.mediaItem.findMany({
      orderBy: [{ watchCount: 'asc' }, { lastWatched: 'asc' }],
      take: limit,
    });
  },

  async create(data: {
    title: string;
    type: 'movie' | 'tv';
    tmdbId?: number;
    imdbId?: string;
    year?: number;
    sonarrId?: number;
    radarrId?: number;
    embyId?: string;
  }) {
    return await prisma.mediaItem.create({
      data,
    });
  },

  async update(
    id: string,
    data: {
      title?: string;
      type?: 'movie' | 'tv';
      tmdbId?: number;
      imdbId?: string;
      year?: number;
      lastWatched?: Date;
      watchCount?: number;
      sonarrId?: number;
      radarrId?: number;
      embyId?: string;
    }
  ) {
    return await prisma.mediaItem.update({
      where: { id },
      data,
    });
  },

  async incrementWatchCount(id: string) {
    return await prisma.mediaItem.update({
      where: { id },
      data: {
        watchCount: { increment: 1 },
        lastWatched: new Date(),
      },
    });
  },

  async delete(id: string) {
    return await prisma.mediaItem.delete({
      where: { id },
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
