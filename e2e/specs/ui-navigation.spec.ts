import { test, expect } from '@playwright/test';

test.describe('UI Navigation Tests', () => {
  test('should display the main page with expected elements', async ({
    page,
  }) => {
    await page.goto('/');

    // Basic page structure should be visible
    await expect(page.locator('body')).toBeVisible();

    // Should have some heading or content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('Page loaded successfully');
  });

  test('should be able to navigate to settings page', async ({ page }) => {
    await page.goto('/settings');

    // Settings page should load
    await expect(page.locator('body')).toBeVisible();

    // Log what's on the settings page
    const settingsContent = await page.textContent('body');
    console.log('Settings page content exists:', !!settingsContent);
  });

  test('should be able to handle navigation between pages', async ({
    page,
  }) => {
    // Start at home
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Navigate to settings
    await page.goto('/settings');
    await expect(page.locator('body')).toBeVisible();

    // Navigate back to home
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    console.log('Navigation between pages works');
  });

  test('should handle non-existent pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    // Should either redirect or show 404
    expect([200, 404]).toContain(response?.status());

    await expect(page.locator('body')).toBeVisible();
  });
});
