import { PrismaClient } from '../src/generated/prisma';
import {
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
} from '../src/lib/database';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface SeedConfig {
  sonarrSettings: Array<{
    name: string;
    url: string;
    apiKey: string;
    enabled: boolean;
    selectedFolders: string[];
  }>;
  radarrSettings: Array<{
    name: string;
    url: string;
    apiKey: string;
    enabled: boolean;
    selectedFolders: string[];
  }>;
  // Updated to support single Emby instance (with backward compatibility for arrays)
  embySettings:
    | {
        name: string;
        url: string;
        apiKey: string;
        userId?: string;
        enabled: boolean;
        selectedFolders?: string[];
        preferEmbyDateAdded?: boolean;
      }
    | Array<{
        name: string;
        url: string;
        apiKey: string;
        userId?: string;
        enabled: boolean;
        selectedFolders?: string[];
        preferEmbyDateAdded?: boolean;
      }>;
  appSettings: Array<{
    key: string;
    value: string;
    description: string;
  }>;
  mediaItems: Array<{
    title: string;
    type: string;
    tmdbId?: number;
    imdbId?: string;
    year?: number;
    lastWatched?: string;
    watchCount?: number;
    radarrId?: number;
    sonarrId?: number;
    embyId?: string;
    mediaPath?: string;
    parentFolder?: string;
    sizeOnDisk?: number;
    dateAdded?: string;
    source?: string;
    quality?: string;
    qualityScore?: number;
    episodesOnDisk?: number;
    totalEpisodes?: number;
    seasonCount?: number;
    completionPercentage?: number;
    monitored?: boolean;
    imdbRating?: number;
    tmdbRating?: number;
    playProgress?: number;
    fullyWatched?: boolean;
    runtime?: number;
    sizePerHour?: number;
    genres?: string[];
    overview?: string;
    deletionScore?: number;
  }>;
}

function loadSeedConfig(): SeedConfig {
  const configPath = join(process.cwd(), 'seed-config.json');

  if (!existsSync(configPath)) {
    console.log('⚠️  No seed-config.json found. Using default seed data.');
    console.log(
      '💡 Copy seed-config.example.json to seed-config.json and customize it with your data.'
    );
    return getDefaultSeedConfig();
  }

  try {
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile) as SeedConfig;
    console.log('✅ Loaded seed configuration from seed-config.json');
    return config;
  } catch (error) {
    console.error('❌ Error reading seed-config.json:', error);
    console.log('🔄 Falling back to default seed data...');
    return getDefaultSeedConfig();
  }
}

function getDefaultSeedConfig(): SeedConfig {
  return {
    sonarrSettings: [
      {
        name: 'Main Sonarr',
        url: 'http://localhost:8989',
        apiKey: 'your-sonarr-api-key-here',
        enabled: true,
        selectedFolders: ['/tv', '/media/tv'],
      },
      {
        name: 'Secondary Sonarr',
        url: 'http://sonarr.local:8989',
        apiKey: 'another-sonarr-api-key',
        enabled: false,
        selectedFolders: ['/tv2'],
      },
    ],
    radarrSettings: [
      {
        name: 'Main Radarr',
        url: 'http://localhost:7878',
        apiKey: 'your-radarr-api-key-here',
        enabled: true,
        selectedFolders: ['/movies', '/media/movies'],
      },
      {
        name: 'Secondary Radarr',
        url: 'http://radarr.local:7878',
        apiKey: 'another-radarr-api-key',
        enabled: false,
        selectedFolders: ['/movies2'],
      },
    ],
    embySettings: [
      {
        name: 'Main Emby',
        url: 'http://localhost:8096',
        apiKey: 'your-emby-api-key-here',
        userId: 'emby-user-id',
        enabled: true,
        selectedFolders: ['/movies', '/tv'],
      },
      {
        name: 'Jellyfin Server',
        url: 'http://jellyfin.local:8096',
        apiKey: 'jellyfin-api-key',
        userId: 'jellyfin-user-id',
        enabled: false,
        selectedFolders: ['/media'],
      },
    ],
    appSettings: [
      {
        key: 'refresh_interval',
        value: '3600',
        description: 'Data refresh interval in seconds',
      },
      {
        key: 'enable_notifications',
        value: 'true',
        description: 'Enable push notifications for important events',
      },
      {
        key: 'theme',
        value: 'dark',
        description: 'Default application theme',
      },
    ],
    mediaItems: [
      {
        title: 'The Matrix',
        type: 'movie',
        tmdbId: 603,
        imdbId: 'tt0133093',
        year: 1999,
        lastWatched: '2024-01-15',
        watchCount: 5,
        radarrId: 1,
        embyId: 'emby-matrix-id',
        mediaPath: '/movies/The Matrix (1999)',
        parentFolder: '/movies',
        sizeOnDisk: 2147483648,
        dateAdded: '2023-06-01',
        source: 'Main Radarr',
        quality: 'Bluray-1080p',
        qualityScore: 19,
        monitored: true,
        imdbRating: 8.7,
        tmdbRating: 8.2,
        playProgress: 100,
        fullyWatched: true,
        runtime: 136,
        sizePerHour: 0.94,
        genres: ['Action', 'Sci-Fi'],
        overview:
          'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
      },
      {
        title: 'Inception',
        type: 'movie',
        tmdbId: 27205,
        imdbId: 'tt1375666',
        year: 2010,
        lastWatched: '2024-02-01',
        watchCount: 3,
        radarrId: 2,
        embyId: 'emby-inception-id',
        mediaPath: '/movies/Inception (2010)',
        parentFolder: '/movies',
        sizeOnDisk: 3221225472,
        dateAdded: '2023-07-15',
        source: 'Main Radarr',
        quality: 'Bluray-1080p',
        qualityScore: 19,
        monitored: true,
        imdbRating: 8.8,
        tmdbRating: 8.3,
        playProgress: 85,
        fullyWatched: false,
        runtime: 148,
        sizePerHour: 1.31,
        genres: ['Action', 'Sci-Fi', 'Thriller'],
        overview:
          'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      },
      {
        title: 'The Room',
        type: 'movie',
        tmdbId: 11544,
        imdbId: 'tt0368226',
        year: 2003,
        lastWatched: '2023-10-31',
        watchCount: 1,
        radarrId: 3,
        embyId: 'emby-room-id',
        mediaPath: '/movies/The Room (2003)',
        parentFolder: '/movies',
        sizeOnDisk: 734003200,
        dateAdded: '2023-08-01',
        source: 'Main Radarr',
        quality: 'DVD',
        qualityScore: 1,
        monitored: false,
        imdbRating: 3.7,
        tmdbRating: 3.4,
        playProgress: 15,
        fullyWatched: false,
        runtime: 99,
        sizePerHour: 0.45,
        genres: ['Drama', 'Romance'],
        overview:
          'Johnny is a successful banker who lives happily in San Francisco with his fiancée Lisa.',
      },
    ],
  };
}

function transformMediaItemForDatabase(item: SeedConfig['mediaItems'][0]) {
  return {
    ...item,
    lastWatched: item.lastWatched ? new Date(item.lastWatched) : undefined,
    dateAdded: item.dateAdded ? new Date(item.dateAdded) : undefined,
    sizeOnDisk: item.sizeOnDisk ? BigInt(item.sizeOnDisk) : undefined,
    genres: item.genres ?? [], // Use array or empty array
    deletionScore:
      typeof item.deletionScore === 'number' ? item.deletionScore : 0, // Ensure number
  };
}

async function clearDatabase() {
  console.log('🗑️ Clearing existing data...');

  // Get all existing settings and delete them
  const [sonarrSettings, radarrSettings, embySettings] = await Promise.all([
    sonarrSettingsService.getAll(),
    radarrSettingsService.getAll(),
    embySettingsService.get(),
  ]);

  // Delete all existing settings
  await Promise.all([
    ...sonarrSettings.map((setting) =>
      sonarrSettingsService.delete(setting.id)
    ),
    ...radarrSettings.map((setting) =>
      radarrSettingsService.delete(setting.id)
    ),
    // Delete single Emby instance if it exists
    ...(embySettings ? [embySettingsService.delete()] : []),
  ]);

  console.log(
    `🗑️ Cleared ${sonarrSettings.length} Sonarr, ${
      radarrSettings.length
    } Radarr, and ${embySettings ? 1 : 0} Emby settings`
  );
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Load seed configuration
    const config = loadSeedConfig();

    // Clear existing data (optional - remove if you want to keep existing data)
    await prisma.mediaItem.deleteMany();
    await prisma.appSettings.deleteMany();
    await clearDatabase();
    console.log('🗑️ Cleared existing data');

    // Seed Sonarr Settings using the new prefixed settings service
    const sonarrPromises = config.sonarrSettings.map((setting) =>
      sonarrSettingsService.create({
        name: setting.name,
        url: setting.url,
        apiKey: setting.apiKey,
        enabled: setting.enabled,
        selectedFolders: setting.selectedFolders,
      })
    );
    const sonarrSettings = await Promise.all(sonarrPromises);
    console.log(`📺 Created ${sonarrSettings.length} Sonarr instances`);

    // Seed Radarr Settings using the new prefixed settings service
    const radarrPromises = config.radarrSettings.map((setting) =>
      radarrSettingsService.create({
        name: setting.name,
        url: setting.url,
        apiKey: setting.apiKey,
        enabled: setting.enabled,
        selectedFolders: setting.selectedFolders,
      })
    );
    const radarrSettings = await Promise.all(radarrPromises);
    console.log(`🎬 Created ${radarrSettings.length} Radarr instances`);

    // Seed Emby Settings using the new single instance service
    let embyCreated = false;
    if (config.embySettings) {
      // Handle both single object and legacy array formats
      const embySettingsArray = Array.isArray(config.embySettings)
        ? config.embySettings
        : [config.embySettings];

      // Only take the first Emby setting if multiple are provided (for backward compatibility)
      const embySettingToCreate = embySettingsArray[0];

      if (embySettingToCreate) {
        await embySettingsService.create({
          name: embySettingToCreate.name,
          url: embySettingToCreate.url,
          apiKey: embySettingToCreate.apiKey,
          userId: embySettingToCreate.userId,
          enabled: embySettingToCreate.enabled,
          selectedFolders: embySettingToCreate.selectedFolders,
          preferEmbyDateAdded: embySettingToCreate.preferEmbyDateAdded,
        });
        embyCreated = true;

        if (
          Array.isArray(config.embySettings) &&
          config.embySettings.length > 1
        ) {
          console.log(
            `⚠️  Multiple Emby settings provided, only the first one was created (single instance mode)`
          );
        }
      }
    }
    console.log(`🎭 Created ${embyCreated ? 1 : 0} Emby instance`);

    // Seed App Settings
    const appSettings = await prisma.appSettings.createMany({
      data: config.appSettings,
    });
    console.log(`⚙️ Created ${appSettings.count} app settings`);

    // Seed Media Items
    const mediaItems = await prisma.mediaItem.createMany({
      data: config.mediaItems.map(transformMediaItemForDatabase),
    });
    console.log(`🎯 Created ${mediaItems.count} media items`);

    console.log('✅ Database seeding completed successfully!');

    // Print summary
    console.log('\n📊 Seeding Summary:');
    console.log(`   • Sonarr instances: ${sonarrSettings.length}`);
    console.log(`   • Radarr instances: ${radarrSettings.length}`);
    console.log(`   • Emby instances: ${embyCreated ? 1 : 0}`);
    console.log(`   • App settings: ${appSettings.count}`);
    console.log(`   • Media items: ${mediaItems.count}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedDatabase().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
