import { test } from '../fixtures/simple-database';

test.describe('Test Setup Verification', () => {
  test('should have working test database', async ({ database }) => {
    // Verify database connection by checking both models
    const mediaItemCount = await database.mediaItem.count();
    const appSettingsCount = await database.appSettings.count();
    test.expect(mediaItemCount).toBeGreaterThanOrEqual(0);
    test.expect(appSettingsCount).toBeGreaterThanOrEqual(0);
  });

  test('should have test data seeded', async ({ database }) => {
    // Verify test media items exist
    const movieItem = await database.mediaItem.findFirst({
      where: { type: 'MOVIE' },
    });
    test.expect(movieItem).toBeTruthy();

    const seriesItem = await database.mediaItem.findFirst({
      where: { type: 'SERIES' },
    });
    test.expect(seriesItem).toBeTruthy();

    // Verify app settings exist
    const deletionScoreSetting = await database.appSettings.findFirst({
      where: { key: 'deletion_score_weight_play_count' },
    });
    test.expect(deletionScoreSetting).toBeTruthy();
  });

  test('should have test media data', async ({ database }) => {
    const mediaItemCount = await database.mediaItem.count();
    test.expect(mediaItemCount).toBeGreaterThan(0);
  });

  test('should be able to access the application', async ({ page }) => {
    await page.goto('/');
    await test.expect(page).toHaveTitle(/Least Watched/);
  });
});
