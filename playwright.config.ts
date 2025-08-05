import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory structure
  testDir: './e2e/specs',

  // Run all tests in parallel for better performance
  fullyParallel: true,

  // Fail the build on CI if test.only is left in source code
  forbidOnly: !!process.env.CI,

  // Retry configuration - more retries in CI environment
  retries: process.env.CI ? 2 : 0,

  // Worker configuration - limit workers in CI to avoid resource issues
  workers: process.env.CI ? 1 : undefined,

  // Test timeout - 30 seconds per test
  timeout: 30000,

  // Global timeout for entire test run - 10 minutes
  globalTimeout: 600000,

  // JSON reporter for test results (HTML reporter disabled)
  reporter: [['json', { outputFile: 'e2e/test-results.json' }]],

  // Output directory for test artifacts
  outputDir: 'e2e/test-results',

  // Default options for all tests
  use: {
    // Base URL for all page.goto() calls
    baseURL: 'http://localhost:3000',

    // Collect trace on first retry for debugging
    trace: 'on-first-retry',

    // Take screenshots only on failure
    screenshot: 'only-on-failure',

    // Record video only on first retry
    video: 'on-first-retry',

    // Browser options
    headless: true,

    // Default viewport
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
  },

  // Expect configuration
  expect: {
    // Maximum time expect() should wait for conditions
    timeout: 5000,

    toHaveScreenshot: {
      // Acceptable pixel difference for screenshot comparisons
      maxDiffPixels: 100,
    },

    toMatchSnapshot: {
      // Acceptable ratio of different pixels
      maxDiffPixelRatio: 0.1,
    },
  },

  // Test projects for different browsers
  projects: [
    // Setup project for database initialization and test data seeding
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        // Use faster engine for setup tasks
        ...devices['Desktop Chrome'],
      },
    },

    // Chromium tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // // Firefox tests
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    //   dependencies: ['setup'],
    // },

    // // WebKit tests
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    //   dependencies: ['setup'],
    // },

    // // Mobile Chrome tests
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  // Start dev server before running tests
  webServer: {
    command: 'cross-env DATABASE_URL=file:./test.db next dev --turbopack',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      DATABASE_URL: 'file:./test.db',
    },
  },
});
