#!/usr/bin/env bun
import {
  database,
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
} from '../src/lib/database';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Database CLI for Least Watched App

Usage: bun run scripts/db-cli.ts <command> [options]

Commands:
  status              - Check database connection
  list [service]      - List all settings or specific service settings
  add-sonarr         - Add Sonarr instance interactively
  add-radarr         - Add Radarr instance interactively
  add-emby           - Add Emby instance interactively
  test <service> <id> - Test connection for specific service

Examples:
  bun run scripts/db-cli.ts status
  bun run scripts/db-cli.ts list sonarr
  bun run scripts/db-cli.ts add-sonarr
  bun run scripts/db-cli.ts test sonarr abc123
`);
    return;
  }

  await database.connect();

  try {
    switch (command) {
      case 'status':
        await checkStatus();
        break;
      case 'list':
        await listSettings(args[1]);
        break;
      case 'add-sonarr':
        await addSonarrInteractive();
        break;
      case 'add-radarr':
        await addRadarrInteractive();
        break;
      case 'add-emby':
        await addEmbyInteractive();
        break;
      case 'test':
        await testConnection(args[1], args[2]);
        break;
      default:
        console.log(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await database.disconnect();
  }
}

async function checkStatus() {
  const isHealthy = await database.healthCheck();
  console.log('Database status:', isHealthy ? '✅ OK' : '❌ FAILED');

  if (isHealthy) {
    const [sonarrCount, radarrCount, embyCount] = await Promise.all([
      sonarrSettingsService.getAll().then((s) => s.length),
      radarrSettingsService.getAll().then((s) => s.length),
      embySettingsService.getAll().then((s) => s.length),
    ]);

    console.log(`\nSettings count:`);
    console.log(`  Sonarr: ${sonarrCount}`);
    console.log(`  Radarr: ${radarrCount}`);
    console.log(`  Emby: ${embyCount}`);
  }
}

async function listSettings(service?: string) {
  if (!service || service === 'sonarr') {
    const settings = await sonarrSettingsService.getAll();
    console.log('\n🎬 Sonarr Settings:');
    settings.forEach((s) => {
      console.log(`  ${s.enabled ? '✅' : '❌'} ${s.name} - ${s.url}`);
    });
  }

  if (!service || service === 'radarr') {
    const settings = await radarrSettingsService.getAll();
    console.log('\n🎞️ Radarr Settings:');
    settings.forEach((s) => {
      console.log(`  ${s.enabled ? '✅' : '❌'} ${s.name} - ${s.url}`);
    });
  }

  if (!service || service === 'emby') {
    const settings = await embySettingsService.getAll();
    console.log('\n📺 Emby Settings:');
    settings.forEach((s) => {
      console.log(`  ${s.enabled ? '✅' : '❌'} ${s.name} - ${s.url}`);
    });
  }
}

async function addSonarrInteractive() {
  const name = await prompt('Enter Sonarr instance name: ');
  const url = await prompt('Enter Sonarr URL (e.g., http://localhost:8989): ');
  const apiKey = await prompt('Enter API Key: ');

  if (!name || !url || !apiKey) {
    console.log('❌ All fields are required');
    return;
  }

  try {
    const setting = await sonarrSettingsService.create({
      name,
      url,
      apiKey,
      enabled: true,
    });
    console.log(`✅ Created Sonarr setting: ${setting.name}`);
  } catch (error) {
    console.log('❌ Failed to create Sonarr setting:', error);
  }
}

async function addRadarrInteractive() {
  const name = await prompt('Enter Radarr instance name: ');
  const url = await prompt('Enter Radarr URL (e.g., http://localhost:7878): ');
  const apiKey = await prompt('Enter API Key: ');

  if (!name || !url || !apiKey) {
    console.log('❌ All fields are required');
    return;
  }

  try {
    const setting = await radarrSettingsService.create({
      name,
      url,
      apiKey,
      enabled: true,
    });
    console.log(`✅ Created Radarr setting: ${setting.name}`);
  } catch (error) {
    console.log('❌ Failed to create Radarr setting:', error);
  }
}

async function addEmbyInteractive() {
  const name = await prompt('Enter Emby instance name: ');
  const url = await prompt('Enter Emby URL (e.g., http://localhost:8096): ');
  const apiKey = await prompt('Enter API Key: ');
  const userId = await prompt('Enter User ID (optional): ');

  if (!name || !url || !apiKey) {
    console.log('❌ Name, URL, and API Key are required');
    return;
  }

  try {
    const setting = await embySettingsService.create({
      name,
      url,
      apiKey,
      userId: userId || undefined,
      enabled: true,
    });
    console.log(`✅ Created Emby setting: ${setting.name}`);
  } catch (error) {
    console.log('❌ Failed to create Emby setting:', error);
  }
}

async function testConnection(service: string, id: string) {
  if (!service || !id) {
    console.log('❌ Service and ID are required');
    return;
  }

  console.log(`Testing ${service} connection for ID: ${id}`);
  // This would need to be implemented based on the actual API service
  console.log('🔍 Connection testing not implemented yet');
}

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Run the CLI
main().catch(console.error);
