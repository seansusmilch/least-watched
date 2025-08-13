'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { kvSettingsStore } from '@/lib/utils/kv-settings';
import { AllSettingsEnvelopeSchema } from '@/lib/validation/schemas';
import {
  getAppSettings,
  updateAppSettings,
  triggerDeletionScoreRecalculation,
} from './app-settings';
import {
  getDeletionScoreSettings,
  setDeletionScoreSettings,
} from './deletion-score';
import {
  embySettingsService,
  radarrSettingsService,
  sonarrSettingsService,
} from '@/lib/database';

// Section schemas have been centralized in validation/schemas

export type AllSettingsEnvelope = z.infer<typeof AllSettingsEnvelopeSchema>;

export async function exportAllSettings(): Promise<AllSettingsEnvelope> {
  const [app, deletionScore, sonarr, radarr, emby] = await Promise.all([
    getAppSettings(),
    getDeletionScoreSettings(),
    sonarrSettingsService.getAll(),
    radarrSettingsService.getAll(),
    embySettingsService.get(),
  ]);

  let other = await kvSettingsStore.listExcludingPrefixes([
    'sonarr-',
    'radarr-',
    'emby-',
    'deletion_score.',
  ]);
  // Exclude known core app keys already represented elsewhere
  other = other.filter((o) => o.key !== 'date-preference');

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    type: 'all-settings',
    data: {
      app: {
        datePreference: app.datePreference,
        other,
      },
      deletionScore,
      services: {
        sonarr: sonarr.map((s) => ({
          name: s.name,
          url: s.url,
          apiKey: s.apiKey,
          enabled: s.enabled,
          selectedFolders: s.selectedFolders,
        })),
        radarr: radarr.map((s) => ({
          name: s.name,
          url: s.url,
          apiKey: s.apiKey,
          enabled: s.enabled,
          selectedFolders: s.selectedFolders,
        })),
        emby: emby
          ? {
              name: emby.name,
              url: emby.url,
              apiKey: emby.apiKey,
              enabled: emby.enabled,
              selectedLibraries: emby.selectedLibraries,
              selectedFolders: emby.selectedFolders,
            }
          : null,
      },
    },
  };
}

export async function importAllSettings(payload: unknown): Promise<{
  success: boolean;
  message: string;
  createdOrUpdated?: {
    sonarr: { created: number; updated: number };
    radarr: { created: number; updated: number };
    emby: { created: number; updated: number };
  };
}> {
  const parsed = AllSettingsEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: 'Invalid settings file' };
  }

  const { data } = parsed.data;

  const results = {
    sonarr: { created: 0, updated: 0 },
    radarr: { created: 0, updated: 0 },
    emby: { created: 0, updated: 0 },
  };

  // App settings
  await updateAppSettings({ datePreference: data.app.datePreference });
  if (data.app.other && data.app.other.length > 0) {
    await kvSettingsStore.batchUpsert(
      data.app.other.map((o) => ({
        key: o.key,
        value: o.value,
        description: o.description,
      }))
    );
  }

  // Deletion score
  if (data.deletionScore) {
    await setDeletionScoreSettings(data.deletionScore);
  }

  // Sonarr
  for (const instance of data.services.sonarr || []) {
    const existing = await sonarrSettingsService.getByName(instance.name);
    if (existing) {
      await sonarrSettingsService.update(existing.id, {
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
      results.sonarr.updated += 1;
    } else {
      await sonarrSettingsService.create({
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
      results.sonarr.created += 1;
    }
  }

  // Radarr
  for (const instance of data.services.radarr || []) {
    const existing = await radarrSettingsService.getByName(instance.name);
    if (existing) {
      await radarrSettingsService.update(existing.id, {
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
      results.radarr.updated += 1;
    } else {
      await radarrSettingsService.create({
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
      results.radarr.created += 1;
    }
  }

  // Emby (single)
  if (data.services.emby) {
    const exists = await embySettingsService.exists();
    if (exists) {
      await embySettingsService.update({
        name: data.services.emby.name,
        url: data.services.emby.url,
        apiKey: data.services.emby.apiKey,
        enabled: data.services.emby.enabled,
        selectedLibraries: data.services.emby.selectedLibraries,
        selectedFolders: data.services.emby.selectedFolders,
      });
      results.emby.updated = 1;
    } else {
      await embySettingsService.create({
        name: data.services.emby.name,
        url: data.services.emby.url,
        apiKey: data.services.emby.apiKey,
        enabled: data.services.emby.enabled,
        selectedLibraries: data.services.emby.selectedLibraries,
        selectedFolders: data.services.emby.selectedFolders,
      });
      results.emby.created = 1;
    }
  }

  // Trigger deletion score recalculation once after import completes if it
  // hasn't already been triggered by updating deletion score settings above.
  if (!data.deletionScore) {
    await triggerDeletionScoreRecalculation();
  }

  revalidatePath('/settings');
  return {
    success: true,
    message: 'Settings imported successfully',
    createdOrUpdated: results,
  };
}
