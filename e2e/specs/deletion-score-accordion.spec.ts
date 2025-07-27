import { test, expect } from '@playwright/test';

test.describe('Deletion Score Settings Accordion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should hide fine-grained breakdown controls by default', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Verify that breakdown content is hidden by default for factors with breakdowns
    const daysUnwatchedContent = page.locator(
      '[data-testid="daysUnwatched-breakdown-content"]'
    );
    const sizeOnDiskContent = page.locator(
      '[data-testid="sizeOnDisk-breakdown-content"]'
    );
    const ageSinceAddedContent = page.locator(
      '[data-testid="ageSinceAdded-breakdown-content"]'
    );
    const folderSpaceContent = page.locator(
      '[data-testid="folderSpace-breakdown-content"]'
    );

    // These should be hidden initially
    await expect(daysUnwatchedContent).not.toBeVisible();
    await expect(sizeOnDiskContent).not.toBeVisible();
    await expect(ageSinceAddedContent).not.toBeVisible();
    await expect(folderSpaceContent).not.toBeVisible();
  });

  test('should show breakdown controls when accordion is expanded', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Click on the breakdown trigger for days unwatched
    await page.click('[data-testid="daysUnwatched-breakdown-trigger"]');

    // Verify that the breakdown content is now visible
    const daysUnwatchedContent = page.locator(
      '[data-testid="daysUnwatched-breakdown-content"]'
    );
    await expect(daysUnwatchedContent).toBeVisible();

    // Verify that the breakdown sliders are present
    await expect(page.locator('text=≤30 days')).toBeVisible();
    await expect(page.locator('text=31-90 days')).toBeVisible();
    await expect(page.locator('text=91-180 days')).toBeVisible();
  });

  test('should hide breakdown controls when accordion is collapsed', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Click on the breakdown trigger for days unwatched to expand
    await page.click('[data-testid="daysUnwatched-breakdown-trigger"]');

    // Verify that the breakdown content is visible
    const daysUnwatchedContent = page.locator(
      '[data-testid="daysUnwatched-breakdown-content"]'
    );
    await expect(daysUnwatchedContent).toBeVisible();

    // Click again to collapse
    await page.click('[data-testid="daysUnwatched-breakdown-trigger"]');

    // Verify that the breakdown content is now hidden
    await expect(daysUnwatchedContent).not.toBeVisible();
  });

  test('should work for multiple factors independently', async ({ page }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Expand days unwatched breakdown
    await page.click('[data-testid="daysUnwatched-breakdown-trigger"]');
    await expect(
      page.locator('[data-testid="daysUnwatched-breakdown-content"]')
    ).toBeVisible();

    // Expand size on disk breakdown
    await page.click('[data-testid="sizeOnDisk-breakdown-trigger"]');
    await expect(
      page.locator('[data-testid="sizeOnDisk-breakdown-content"]')
    ).toBeVisible();

    // Collapse days unwatched - size on disk should still be open
    await page.click('[data-testid="daysUnwatched-breakdown-trigger"]');
    await expect(
      page.locator('[data-testid="daysUnwatched-breakdown-content"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="sizeOnDisk-breakdown-content"]')
    ).toBeVisible();
  });

  test('should not show breakdown controls for factors without breakdowns', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Never watched bonus doesn't have breakdown controls
    const neverWatchedTrigger = page.locator(
      '[data-testid="neverWatched-breakdown-trigger"]'
    );
    await expect(neverWatchedTrigger).not.toBeVisible();
  });
});
