import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display the settings header', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: 'Settings', exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText('Configure your media management system')
    ).toBeVisible();
  });

  test('should display all main tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('media-services-tab')).toBeVisible();
    await expect(page.getByTestId('deletion-score-tab')).toBeVisible();
    await expect(page.getByTestId('advanced-settings-tab')).toBeVisible();
  });

  test('should default to Media Services tab', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('media-services-tab')).toHaveAttribute(
      'data-state',
      'active'
    );
  });
});

test.describe('Settings Page - Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should switch to Deletion Scoring tab', async ({ page }) => {
    await page.getByTestId('deletion-score-tab').click();
    await expect(page.getByTestId('deletion-score-tab')).toHaveAttribute(
      'data-state',
      'active'
    );
    await expect(page).toHaveURL(/tab=deletion/);
  });

  test('should switch to Advanced tab', async ({ page }) => {
    await page.getByTestId('advanced-settings-tab').click();
    await expect(page.getByTestId('advanced-settings-tab')).toHaveAttribute(
      'data-state',
      'active'
    );
    await expect(page).toHaveURL(/tab=advanced/);
  });

  test('should preserve tab state in URL', async ({ page }) => {
    await page.getByTestId('deletion-score-tab').click();
    await expect(page).toHaveURL(/tab=deletion/);

    await page.reload();
    await expect(page.getByTestId('deletion-score-tab')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  test('should navigate via URL parameters', async ({ page }) => {
    await page.goto('/settings?tab=advanced');
    await expect(page.getByTestId('advanced-settings-tab')).toHaveAttribute(
      'data-state',
      'active'
    );
  });
});

test.describe('Settings Page - Media Services Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings?tab=services');
  });

  test('should display service configuration sections', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const servicesTab = page
      .locator('[role="tabpanel"][data-state="active"]')
      .first();
    await expect(servicesTab).toBeVisible();
  });
});

test.describe('Settings Page - Deletion Scoring Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings?tab=deletion');
  });

  test('should display deletion scoring settings', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const scoringTab = page
      .locator('[role="tabpanel"][data-state="active"]')
      .first();
    await expect(scoringTab).toBeVisible();
  });
});

test.describe('Settings Page - Advanced Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings?tab=advanced');
  });

  test('should display advanced settings', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const advancedTab = page
      .locator('[role="tabpanel"][data-state="active"]')
      .first();
    await expect(advancedTab).toBeVisible();
  });
});
