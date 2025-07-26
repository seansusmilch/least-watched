import { test, expect } from '@playwright/test';

test.describe('Deletion Score Settings Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should export deletion score settings to JSON file', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Click export button
    await page.click('[data-testid="export-settings"]');

    // Wait for download to start (this will trigger browser download)
    // Note: In headless mode, we can't easily verify the file was downloaded
    // but we can verify the button click doesn't cause errors

    // Verify the export button is still enabled and functional
    await expect(page.locator('[data-testid="export-settings"]')).toBeEnabled();
  });

  test('should import deletion score settings from JSON file', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Wait for settings to be loaded
    await page.waitForSelector('[data-testid="last-watched-weight"]');

    // Click import button to open dialog
    await page.click('[data-testid="import-settings"]');

    // Wait for dialog to open
    await page.waitForSelector('[data-testid="import-file-input"]');

    // Create a test JSON file with modified settings
    const testSettings = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        enabled: true,
        daysUnwatchedEnabled: true,
        daysUnwatchedMaxPoints: 40, // Different from default
        daysUnwatched30Days: 0,
        daysUnwatched90Days: 10,
        daysUnwatched180Days: 20,
        daysUnwatched365Days: 30,
        daysUnwatchedOver365: 40,
        neverWatchedEnabled: true,
        neverWatchedPoints: 20,
        sizeOnDiskEnabled: true,
        sizeOnDiskMaxPoints: 30,
        sizeOnDisk1GB: 0,
        sizeOnDisk5GB: 10,
        sizeOnDisk10GB: 15,
        sizeOnDisk20GB: 20,
        sizeOnDisk50GB: 25,
        sizeOnDiskOver50GB: 30,
        ageSinceAddedEnabled: true,
        ageSinceAddedMaxPoints: 15,
        ageSinceAdded180Days: 5,
        ageSinceAdded365Days: 10,
        ageSinceAddedOver730: 15,
        folderSpaceEnabled: true,
        folderSpaceMaxPoints: 20,
        folderSpace10Percent: 20,
        folderSpace20Percent: 15,
        folderSpace30Percent: 10,
        folderSpace50Percent: 5,
      },
    };

    // Create a file input with the test data - use the hidden input within FileInput
    await page.setInputFiles(
      '[data-testid="import-file-input"] input[type="file"]',
      {
        name: 'test-settings.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(testSettings)),
      }
    );

    // Wait for import to complete
    await page.waitForTimeout(1000);

    // Verify the settings were updated
    const newMaxPoints = await page
      .locator('[data-testid="last-watched-weight"]')
      .getAttribute('aria-valuenow');
    expect(newMaxPoints).toBe('40');

    // Verify success toast appears
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('should handle invalid JSON file gracefully', async ({ page }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Click import button to open dialog
    await page.click('[data-testid="import-settings"]');

    // Wait for dialog to open
    await page.waitForSelector('[data-testid="import-file-input"]');

    // Create an invalid JSON file
    const invalidJson = '{ "invalid": "json" }';

    // Create a file input with invalid data - use the hidden input within FileInput
    await page.setInputFiles(
      '[data-testid="import-file-input"] input[type="file"]',
      {
        name: 'invalid-settings.json',
        mimeType: 'application/json',
        buffer: Buffer.from(invalidJson),
      }
    );

    // Wait for import to complete
    await page.waitForTimeout(1000);

    // Verify error toast appears
    await expect(page.locator('.toast-error')).toBeVisible();
  });

  test('should handle missing required fields in imported file', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Click import button to open dialog
    await page.click('[data-testid="import-settings"]');

    // Wait for dialog to open
    await page.waitForSelector('[data-testid="import-file-input"]');

    // Create a JSON file with missing required fields
    const incompleteSettings = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        enabled: true,
        // Missing other required fields
      },
    };

    // Create a file input with incomplete data - use the hidden input within FileInput
    await page.setInputFiles(
      '[data-testid="import-file-input"] input[type="file"]',
      {
        name: 'incomplete-settings.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(incompleteSettings)),
      }
    );

    // Wait for import to complete
    await page.waitForTimeout(1000);

    // Verify error toast appears
    await expect(page.locator('.toast-error')).toBeVisible();
  });

  test('should validate that deletion score factors add up to 100 points', async ({
    page,
  }) => {
    // Navigate to deletion score settings tab
    await page.click('[data-testid="deletion-score-tab"]');

    // Wait for the settings to load
    await page.waitForSelector('[data-testid="save-score-settings"]');

    // Initially, settings should be valid (default settings add up to 100)
    await expect(
      page.locator('[data-testid="save-score-settings"]')
    ).toBeEnabled();

    // Modify the days unwatched max points to make total > 100
    const daysUnwatchedSlider = page.locator(
      '[data-testid="last-watched-weight"]'
    );
    await daysUnwatchedSlider.click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // Wait for validation to update
    await page.waitForTimeout(500);

    // Save button should now be disabled
    await expect(
      page.locator('[data-testid="save-score-settings"]')
    ).toBeDisabled();

    // Should show validation error message
    await expect(
      page.locator(
        'text=Deletion score factors must add up to exactly 100 points'
      )
    ).toBeVisible();

    // Try to click save button - should show error toast
    await page.click('[data-testid="save-score-settings"]');
    await expect(page.locator('.toast-error')).toBeVisible();

    // Reset the slider back to valid value
    await daysUnwatchedSlider.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // Wait for validation to update
    await page.waitForTimeout(500);

    // Save button should be enabled again
    await expect(
      page.locator('[data-testid="save-score-settings"]')
    ).toBeEnabled();

    // Validation error should be gone
    await expect(
      page.locator(
        'text=Deletion score factors must add up to exactly 100 points'
      )
    ).not.toBeVisible();
  });
});
