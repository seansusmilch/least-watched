import { test, expect } from '../fixtures/database';

test.describe('Simple Infrastructure Test', () => {
  test('should be able to access the application', async ({ page }) => {
    await page.goto('/');

    // Check if the page loads
    await expect(page).toHaveTitle(/Least Watched/);

    // Check if we can see some basic UI elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be able to navigate to settings', async ({ page }) => {
    await page.goto('/settings');

    // Settings page should load
    await expect(page.locator('body')).toBeVisible();
  });
});
