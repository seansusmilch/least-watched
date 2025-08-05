/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';
import { PrismaClient } from '../../src/generated/prisma';
import { execSync } from 'child_process';

// Simple test database configuration
const getTestDatabaseUrl = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `file:./e2e/test-${timestamp}-${random}.db`;
};

export interface SimpleDatabaseFixture {
  database: PrismaClient;
}

// Extended test with simplified database fixture
export const test = base.extend<SimpleDatabaseFixture>({
  database: async ({}, testUse: (arg: PrismaClient) => Promise<void>) => {
    const testDbUrl = getTestDatabaseUrl();
    process.env.TEST_DATABASE_URL = testDbUrl;

    // Setup test database
    try {
      execSync('bunx prisma db push --force-reset', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: testDbUrl },
      });
    } catch (error) {
      console.log('Database setup error (continuing anyway):', error);
    }

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    // Seed basic test data
    try {
      // Clear existing data
      await prisma.appSettings.deleteMany();
      await prisma.mediaItem.deleteMany();

      // Create test media items
      await prisma.mediaItem.create({
        data: {
          title: 'Test Movie',
          type: 'MOVIE',
          year: 2023,
          tmdbId: 12345,
          imdbId: 'tt1234567',
          watchCount: 2,
          embyId: 'test-emby-movie-1',
          radarrId: 100,
          mediaPath: '/media/movies/test-movie.mkv',
          parentFolder: '/media/movies',
          sizeOnDisk: BigInt('2000000000'),
          dateAdded: new Date(),
          source: 'radarr',
          quality: '1080p',
          qualityScore: 8,
          monitored: true,
          imdbRating: 8.5,
          tmdbRating: 8.2,
          playProgress: 100,
          fullyWatched: true,
          runtime: 120,
          sizePerHour: 1.67,
          genres: JSON.stringify(['Action', 'Adventure']),
          overview: 'A test movie for E2E testing',
          deletionScore: 25.5,
        },
      });

      await prisma.mediaItem.create({
        data: {
          title: 'Test TV Series',
          type: 'SERIES',
          year: 2022,
          tmdbId: 67890,
          imdbId: 'tt7654321',
          watchCount: 15,
          embyId: 'test-emby-series-1',
          sonarrId: 200,
          mediaPath: '/media/tv/test-series/',
          parentFolder: '/media/tv',
          sizeOnDisk: BigInt('10000000000'),
          dateAdded: new Date(),
          source: 'sonarr',
          quality: '1080p',
          qualityScore: 9,
          episodesOnDisk: 24,
          totalEpisodes: 24,
          seasonCount: 2,
          completionPercentage: 100,
          monitored: true,
          imdbRating: 9.1,
          tmdbRating: 8.8,
          playProgress: 100,
          fullyWatched: true,
          runtime: 45,
          sizePerHour: 2.22,
          genres: JSON.stringify(['Drama', 'Thriller']),
          overview: 'A test TV series for E2E testing',
          deletionScore: 15.2,
        },
      });

      // Create basic app settings
      await prisma.appSettings.createMany({
        data: [
          {
            key: 'deletion_score_weight_play_count',
            value: '0.3',
            description: 'Weight for play count in deletion score calculation',
          },
          {
            key: 'deletion_score_weight_last_watched',
            value: '0.4',
            description:
              'Weight for last watched time in deletion score calculation',
          },
          {
            key: 'deletion_score_weight_file_size',
            value: '0.2',
            description: 'Weight for file size in deletion score calculation',
          },
          {
            key: 'deletion_score_weight_rating',
            value: '0.1',
            description: 'Weight for rating in deletion score calculation',
          },

          // Emby instance configuration
          {
            key: 'emby-name',
            value: 'Test Emby Server',
            description: 'Emby server name',
          },
          {
            key: 'emby-url',
            value: 'http://localhost:3000/api/mock/emby',
            description: 'Emby server URL',
          },
          {
            key: 'emby-apiKey',
            value: 'test-emby-api-key',
            description: 'Emby API key',
          },
          {
            key: 'emby-userId',
            value: 'test-user-id',
            description: 'Emby user ID',
          },
          {
            key: 'emby-enabled',
            value: 'true',
            description: 'Emby server enabled status',
          },
          {
            key: 'emby-selectedFolders',
            value: JSON.stringify(['/movies', '/tv']),
            description: 'Emby selected folders',
          },

          // Sonarr instance configuration
          {
            key: 'sonarr-test-name',
            value: 'Test Sonarr Server',
            description: 'Sonarr server name',
          },
          {
            key: 'sonarr-test-url',
            value: 'http://localhost:3000/api/mock/sonarr',
            description: 'Sonarr server URL',
          },
          {
            key: 'sonarr-test-apiKey',
            value: 'test-sonarr-api-key',
            description: 'Sonarr API key',
          },
          {
            key: 'sonarr-test-enabled',
            value: 'true',
            description: 'Sonarr server enabled status',
          },
          {
            key: 'sonarr-test-selectedFolders',
            value: JSON.stringify(['/tv']),
            description: 'Sonarr selected folders',
          },

          // Radarr instance configuration
          {
            key: 'radarr-test-name',
            value: 'Test Radarr Server',
            description: 'Radarr server name',
          },
          {
            key: 'radarr-test-url',
            value: 'http://localhost:3000/api/mock/radarr',
            description: 'Radarr server URL',
          },
          {
            key: 'radarr-test-apiKey',
            value: 'test-radarr-api-key',
            description: 'Radarr API key',
          },
          {
            key: 'radarr-test-enabled',
            value: 'true',
            description: 'Radarr server enabled status',
          },
          {
            key: 'radarr-test-selectedFolders',
            value: JSON.stringify(['/movies']),
            description: 'Radarr selected folders',
          },
        ],
      });
    } catch (seedError) {
      console.log('Seeding error (continuing anyway):', seedError);
    }

    // Provide database to test
    await testUse(prisma);

    // Cleanup
    try {
      await prisma.$disconnect();
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError);
    }
  },
});

export { expect } from '@playwright/test';
