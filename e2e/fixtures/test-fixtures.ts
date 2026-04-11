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
        genres: ['Action', 'Sci-Fi'],
        deletionScore: 0,
      },
      {
        title: 'Breaking Bad',
        type: 'tv',
        tmdbId: 1396,
        tvdbId: 81189,
        embyId: 'e2e-breaking-bad',
        genres: ['Drama', 'Crime'],
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
