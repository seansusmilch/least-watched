import { test, expect } from '@playwright/test';

test.describe('Home Page - Media Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the page header', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Least Watched' })
    ).toBeVisible();
    await expect(
      page.getByText('Identify and manage your unwatched media content')
    ).toBeVisible();
  });

  test('should display the sidebar navigation', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: 'Least Watched' }).first()
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await expect(settingsLink).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForURL(/\/settings/, { timeout: 10000 }),
      settingsLink.click(),
    ]);
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: 'Settings', exact: true }).first()
    ).toBeVisible();
  });

  test('should display media summary cards', async ({ page }) => {
    await expect(page.locator('[class*="card"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display the media table or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const tableOrEmptyState = page.locator(
      "[data-testid='media-table'], table, [data-testid='empty-state']"
    );
    await expect(tableOrEmptyState.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Home Page - Page Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display refresh button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    await expect(refreshButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages using sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await expect(settingsLink).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForURL(/\/settings/, { timeout: 10000 }),
      settingsLink.click(),
    ]);

    await page.waitForLoadState('networkidle');
    const homeLink = page.getByRole('link', { name: 'Least Watched' }).first();
    await expect(homeLink).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForURL('/', { timeout: 10000 }),
      homeLink.click(),
    ]);
  });

  test('should preserve page state on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await expect(settingsLink).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForURL(/\/settings/, { timeout: 10000 }),
      settingsLink.click(),
    ]);

    await page.goBack();
    await page.waitForURL('/', { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: 'Least Watched' })
    ).toBeVisible();
  });
});
