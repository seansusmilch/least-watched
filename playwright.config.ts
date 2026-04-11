import { defineConfig, devices } from "@playwright/test";
import path from 'path';

process.env.DATABASE_URL ??= `file:${path.join(
  process.cwd(),
  'prisma',
  'e2e.db'
)}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bash scripts/dev-server.sh",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
