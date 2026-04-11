import { test, expect } from '../fixtures/test-fixtures';

test.describe.serial('Media Table Rescan', () => {
  test.beforeAll(async ({ seedDatabase }) => {
    void seedDatabase;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows rescan controls after selecting rows', async ({ page }) => {
    const rowCheckbox = page.getByRole('checkbox', { name: 'Select row' }).first();

    await expect(rowCheckbox).toBeVisible({ timeout: 15000 });
    await rowCheckbox.check();

    await expect(page.getByText(/1 selected/)).toBeVisible();
    await expect(page.getByTestId('rescan-selected-button')).toBeVisible();
  });

  test('starts a rescan for selected media items', async ({ page }) => {
    const rowCheckbox = page.getByRole('checkbox', { name: 'Select row' }).first();

    await expect(rowCheckbox).toBeVisible({ timeout: 15000 });
    await rowCheckbox.check();

    const rescanButton = page.getByTestId('rescan-selected-button');
    await expect(rescanButton).toBeEnabled();
    await rescanButton.click();

    await expect(page.getByTestId('progress-message')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId('progress-percentage')).toBeVisible();
    await expect(page.getByTestId('progress-percentage')).toContainText('100');
  });
});
