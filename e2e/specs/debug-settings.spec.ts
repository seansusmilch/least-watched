import { test, expect } from '../fixtures/database';

test.describe('Debug Settings', () => {
  test('should debug database settings', async ({ database }) => {
    // Check all app settings
    const allSettings = await database.appSettings.findMany();
    console.log('All app settings:');
    allSettings.forEach((setting) => {
      console.log(`  ${setting.key} = ${setting.value}`);
    });

    // Check specifically for instance settings
    const instanceSettings = allSettings.filter(
      (s) =>
        s.key.startsWith('emby-') ||
        s.key.startsWith('sonarr-') ||
        s.key.startsWith('radarr-')
    );

    console.log('\nInstance settings:');
    instanceSettings.forEach((setting) => {
      console.log(`  ${setting.key} = ${setting.value}`);
    });

    // Check for enabled settings
    const enabledSettings = allSettings.filter((s) =>
      s.key.includes('enabled')
    );
    console.log('\nEnabled settings:');
    enabledSettings.forEach((setting) => {
      console.log(`  ${setting.key} = ${setting.value}`);
    });

    expect(allSettings.length).toBeGreaterThan(0);
  });

  test('should debug service detection', async () => {
    // Import the services to test them
    const {
      sonarrSettingsService,
      radarrSettingsService,
      embySettingsService,
    } = await import('../../src/lib/database');

    // Test Emby service
    console.log('\n=== Testing Emby Service ===');
    const embySettings = await embySettingsService.get();
    console.log('Emby settings:', embySettings);

    const embyEnabled = await embySettingsService.getEnabled();
    console.log('Emby enabled:', embyEnabled);

    // Test Sonarr service
    console.log('\n=== Testing Sonarr Service ===');
    const sonarrAll = await sonarrSettingsService.getAll();
    console.log('Sonarr all:', sonarrAll);

    const sonarrEnabled = await sonarrSettingsService.getEnabled();
    console.log('Sonarr enabled:', sonarrEnabled);

    // Test Radarr service
    console.log('\n=== Testing Radarr Service ===');
    const radarrAll = await radarrSettingsService.getAll();
    console.log('Radarr all:', radarrAll);

    const radarrEnabled = await radarrSettingsService.getEnabled();
    console.log('Radarr enabled:', radarrEnabled);

    // Check if there are any enabled instances
    const hasEnabledInstances =
      embyEnabled !== null ||
      sonarrEnabled.length > 0 ||
      radarrEnabled.length > 0;
    console.log('\nHas enabled instances:', hasEnabledInstances);

    expect(hasEnabledInstances).toBe(true);
  });
});
