import { test as base } from "@playwright/test";
import { execSync } from "child_process";
import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

async function seedE2EData() {
  await prisma.mediaItem.deleteMany();
  await prisma.appSettings.deleteMany();

  await prisma.mediaItem.createMany({
    data: [
      {
        title: 'The Matrix',
        type: 'movie',
        tmdbId: 603,
        imdbId: 'tt0133093',
        embyId: 'e2e-matrix',
        mediaPath: '/movies/The Matrix (1999)',
        parentFolder: '/movies',
        sizeOnDisk: BigInt(2345678901),
        genres: ['Action', 'Sci-Fi'],
        deletionScore: 0,
      },
      {
        title: 'Breaking Bad',
        type: 'tv',
        tmdbId: 1396,
        tvdbId: 81189,
        embyId: 'e2e-breaking-bad',
        mediaPath: '/tv/Breaking Bad',
        parentFolder: '/tv',
        sizeOnDisk: BigInt(9876543210),
        genres: ['Drama', 'Crime'],
        deletionScore: 0,
      },
      {
        title: 'Inception',
        type: 'movie',
        tmdbId: 27205,
        imdbId: 'tt1375666',
        embyId: 'e2e-inception',
        mediaPath: '/movies/Inception (2010)',
        parentFolder: '/movies',
        sizeOnDisk: BigInt(3210000000),
        genres: ['Action', 'Sci-Fi', 'Thriller'],
        deletionScore: 0,
      },
      {
        title: 'Chernobyl',
        type: 'tv',
        tmdbId: 87108,
        imdbId: 'tt7366338',
        embyId: 'e2e-chernobyl',
        mediaPath: '/tv/Chernobyl',
        parentFolder: '/tv',
        sizeOnDisk: BigInt(4321000000),
        genres: ['Drama', 'History'],
        deletionScore: 0,
      },
    ],
  });
}

export const test = base.extend<{ seedDatabase: void }>({
  seedDatabase: [
    async ({}, use) => {
      execSync('bunx prisma migrate deploy', { stdio: 'inherit' });
      await seedE2EData();
      try {
        await use();
      } finally {
        await prisma.$disconnect();
      }
    },
    { auto: false },
  ],
});

export { expect } from "@playwright/test";
