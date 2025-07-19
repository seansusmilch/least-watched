#!/usr/bin/env bun

/**
 * Migration script to convert from multiple Emby instances to single instance
 *
 * This script:
 * 1. Identifies the primary Emby instance (prefer enabled instances, then first created)
 * 2. Creates a backup of existing multi-instance data
 * 3. Migrates the primary instance to simplified keys without instance IDs
 */

import { PrismaClient } from '../src/generated/prisma';
import {
  prefixedSettingsService,
  type ServiceSettings,
} from '../src/lib/utils/prefixed-settings';
import { singleEmbySettingsService } from '../src/lib/utils/single-emby-settings';
import { writeFile } from 'fs/promises';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface MigrationBackup {
  timestamp: string;
  multiInstanceSettings: ServiceSettings[];
  selectedPrimary?: {
    id: string;
    name: string;
    enabled: boolean;
    createdAt: Date;
  };
}

async function main() {
  console.log('🔄 Starting Emby single instance migration...');

  try {
    // Step 1: Check if single instance already exists
    const existingSingle = await singleEmbySettingsService.exists();
    if (existingSingle) {
      console.log(
        '✅ Single instance Emby configuration already exists. Migration not needed.'
      );
      return;
    }

    // Step 2: Get all existing Emby instances
    const multiInstances = await prefixedSettingsService.getAll('emby');

    if (multiInstances.length === 0) {
      console.log('ℹ️  No existing Emby instances found. Nothing to migrate.');
      return;
    }

    console.log(`📋 Found ${multiInstances.length} existing Emby instance(s)`);
    multiInstances.forEach((instance, index) => {
      console.log(
        `   ${index + 1}. ${instance.name} (${
          instance.enabled ? 'enabled' : 'disabled'
        }) - Created: ${instance.createdAt.toISOString()}`
      );
    });

    // Step 3: Create backup before migration
    console.log('💾 Creating backup of existing multi-instance data...');
    const backup: MigrationBackup = {
      timestamp: new Date().toISOString(),
      multiInstanceSettings: multiInstances,
    };

    // Step 4: Identify primary instance
    console.log('🔍 Identifying primary Emby instance...');
    let primaryInstance = multiInstances.find((instance) => instance.enabled);

    if (!primaryInstance) {
      // No enabled instances, pick the first one (oldest created)
      primaryInstance = multiInstances.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      console.log(
        `⚠️  No enabled instances found. Selecting oldest: ${primaryInstance.name}`
      );
    } else {
      console.log(`✅ Selected enabled instance: ${primaryInstance.name}`);
    }

    backup.selectedPrimary = {
      id: primaryInstance.id,
      name: primaryInstance.name,
      enabled: primaryInstance.enabled,
      createdAt: primaryInstance.createdAt,
    };

    // Write backup to file
    const backupFileName = `emby-migration-backup-${Date.now()}.json`;
    const backupPath = join(process.cwd(), backupFileName);
    await writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
    console.log(`📁 Backup saved to: ${backupFileName}`);

    // Step 5: Migrate primary instance to single instance format
    console.log('🔄 Migrating primary instance to single instance format...');

    await singleEmbySettingsService.create({
      name: primaryInstance.name,
      url: primaryInstance.url,
      apiKey: primaryInstance.apiKey,
      userId: primaryInstance.userId,
      enabled: primaryInstance.enabled,
      selectedFolders: primaryInstance.selectedFolders,
      preferEmbyDateAdded: primaryInstance.preferEmbyDateAdded,
    });

    console.log('✅ Primary instance migrated to single instance format');

    // Step 6: Clean up old multi-instance data
    console.log('🧹 Cleaning up old multi-instance data...');
    for (const instance of multiInstances) {
      await prefixedSettingsService.delete('emby', instance.id);
      console.log(`   Removed instance: ${instance.name} (${instance.id})`);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`   • Migrated primary instance: ${primaryInstance.name}`);
    console.log(`   • Removed ${multiInstances.length} old instance(s)`);
    console.log(`   • Backup saved: ${backupFileName}`);
    console.log('');
    console.log(
      'The application now uses a single Emby instance configuration.'
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function rollback() {
  console.log('🔄 Starting migration rollback...');

  try {
    // Find the most recent backup file
    const backupFiles = readdirSync(process.cwd())
      .filter(
        (file: string) =>
          file.startsWith('emby-migration-backup-') && file.endsWith('.json')
      )
      .sort((a: string, b: string) => b.localeCompare(a)); // Sort descending to get most recent

    if (backupFiles.length === 0) {
      console.error('❌ No backup files found. Cannot rollback.');
      process.exit(1);
    }

    const backupFile = backupFiles[0];
    console.log(`📁 Using backup file: ${backupFile}`);

    const backupContent = readFileSync(backupFile, 'utf-8');
    const backup: MigrationBackup = JSON.parse(backupContent);

    // Remove current single instance if it exists
    const existsSingle = await singleEmbySettingsService.exists();
    if (existsSingle) {
      console.log('🧹 Removing current single instance configuration...');
      await singleEmbySettingsService.delete();
    }

    // Restore multi-instance data
    console.log('🔄 Restoring multi-instance data...');
    for (const instance of backup.multiInstanceSettings) {
      await prefixedSettingsService.create('emby', {
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        userId: instance.userId,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
        preferEmbyDateAdded: instance.preferEmbyDateAdded,
      });
      console.log(`   Restored instance: ${instance.name}`);
    }

    console.log('✅ Rollback completed successfully!');
    console.log(
      `   • Restored ${backup.multiInstanceSettings.length} instance(s)`
    );
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
  rollback().finally(() => prisma.$disconnect());
} else if (args.includes('--help')) {
  console.log('Emby Single Instance Migration Script');
  console.log('');
  console.log('Usage:');
  console.log(
    '  bun run scripts/migrate-emby-single-instance.ts        # Run migration'
  );
  console.log(
    '  bun run scripts/migrate-emby-single-instance.ts --rollback # Rollback migration'
  );
  console.log(
    '  bun run scripts/migrate-emby-single-instance.ts --help   # Show this help'
  );
} else {
  main().finally(() => prisma.$disconnect());
}
