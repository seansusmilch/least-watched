import { PrismaClient } from '../src/generated/prisma';
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
  embySettings: Array<{
    name: string;
    url: string;
    apiKey: string;
    userId: string;
    enabled: boolean;
    selectedFolders: string[];
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
    genres: item.genres ? JSON.stringify(item.genres) : undefined,
  };
}

function transformSonarrSettingForDatabase(
  setting: SeedConfig['sonarrSettings'][0]
) {
  return {
    ...setting,
    selectedFolders: JSON.stringify(setting.selectedFolders),
  };
}

function transformRadarrSettingForDatabase(
  setting: SeedConfig['radarrSettings'][0]
) {
  return {
    ...setting,
    selectedFolders: JSON.stringify(setting.selectedFolders),
  };
}

function transformEmbySettingForDatabase(
  setting: SeedConfig['embySettings'][0]
) {
  return {
    ...setting,
    selectedFolders: JSON.stringify(setting.selectedFolders),
  };
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Load seed configuration
    const config = loadSeedConfig();

    // Clear existing data (optional - remove if you want to keep existing data)
    await prisma.mediaItem.deleteMany();
    await prisma.appSettings.deleteMany();
    await prisma.embySettings.deleteMany();
    await prisma.radarrSettings.deleteMany();
    await prisma.sonarrSettings.deleteMany();
    console.log('🗑️ Cleared existing data');

    // Seed Sonarr Settings
    const sonarrSettings = await prisma.sonarrSettings.createMany({
      data: config.sonarrSettings.map(transformSonarrSettingForDatabase),
    });
    console.log(`📺 Created ${sonarrSettings.count} Sonarr instances`);

    // Seed Radarr Settings
    const radarrSettings = await prisma.radarrSettings.createMany({
      data: config.radarrSettings.map(transformRadarrSettingForDatabase),
    });
    console.log(`🎬 Created ${radarrSettings.count} Radarr instances`);

    // Seed Emby Settings
    const embySettings = await prisma.embySettings.createMany({
      data: config.embySettings.map(transformEmbySettingForDatabase),
    });
    console.log(`🎭 Created ${embySettings.count} Emby instances`);

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
    console.log(`   • Sonarr instances: ${sonarrSettings.count}`);
    console.log(`   • Radarr instances: ${radarrSettings.count}`);
    console.log(`   • Emby instances: ${embySettings.count}`);
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
