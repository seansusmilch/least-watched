'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { kvSettingsStore } from '@/lib/utils/kv-settings';
import {
  getAppSettings,
  setAppSetting,
  updateAppSettings,
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

const ServiceInstanceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  apiKey: z.string(),
  enabled: z.boolean().optional().default(true),
  selectedFolders: z.array(z.string()).optional(),
});

const EmbyInstanceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  apiKey: z.string(),
  enabled: z.boolean().optional().default(true),
  selectedLibraries: z.array(z.string()).optional(),
  selectedFolders: z.array(z.string()).optional(),
});

const AppExportSchema = z.object({
  datePreference: z.enum(['arr', 'emby', 'oldest']),
  other: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

const DeletionScoreSettingsSchema = z.object({
  enabled: z.boolean(),
  daysUnwatchedEnabled: z.boolean(),
  daysUnwatchedMaxPoints: z.number(),
  daysUnwatchedBreakpoints: z.array(
    z.object({ value: z.number(), percent: z.number() })
  ),
  neverWatchedEnabled: z.boolean(),
  neverWatchedPoints: z.number(),
  sizeOnDiskEnabled: z.boolean(),
  sizeOnDiskMaxPoints: z.number(),
  sizeOnDiskBreakpoints: z.array(
    z.object({ value: z.number(), percent: z.number() })
  ),
  ageSinceAddedEnabled: z.boolean(),
  ageSinceAddedMaxPoints: z.number(),
  ageSinceAddedBreakpoints: z.array(
    z.object({ value: z.number(), percent: z.number() })
  ),
  folderSpaceEnabled: z.boolean(),
  folderSpaceMaxPoints: z.number(),
  folderSpaceBreakpoints: z.array(
    z.object({ value: z.number(), percent: z.number() })
  ),
});

const AllSettingsEnvelopeSchema = z.object({
  version: z.literal('1.0'),
  exportedAt: z.string(),
  type: z.literal('all-settings'),
  data: z.object({
    app: AppExportSchema,
    deletionScore: DeletionScoreSettingsSchema,
    services: z.object({
      sonarr: z.array(ServiceInstanceSchema),
      radarr: z.array(ServiceInstanceSchema),
      emby: EmbyInstanceSchema.nullable().optional(),
    }),
  }),
});

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
    sonarr: number;
    radarr: number;
    emby: number;
  };
}> {
  const parsed = AllSettingsEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, message: 'Invalid settings file' };
  }

  const { data } = parsed.data;

  const results = { sonarr: 0, radarr: 0, emby: 0 };

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
  await setDeletionScoreSettings(data.deletionScore);

  // Sonarr
  for (const instance of data.services.sonarr) {
    const existing = await sonarrSettingsService.getByName(instance.name);
    if (existing) {
      await sonarrSettingsService.update(existing.id, {
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
    } else {
      await sonarrSettingsService.create({
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
    }
    results.sonarr += 1;
  }

  // Radarr
  for (const instance of data.services.radarr) {
    const existing = await radarrSettingsService.getByName(instance.name);
    if (existing) {
      await radarrSettingsService.update(existing.id, {
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
    } else {
      await radarrSettingsService.create({
        name: instance.name,
        url: instance.url,
        apiKey: instance.apiKey,
        enabled: instance.enabled,
        selectedFolders: instance.selectedFolders,
      });
    }
    results.radarr += 1;
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
    } else {
      await embySettingsService.create({
        name: data.services.emby.name,
        url: data.services.emby.url,
        apiKey: data.services.emby.apiKey,
        enabled: data.services.emby.enabled,
        selectedLibraries: data.services.emby.selectedLibraries,
        selectedFolders: data.services.emby.selectedFolders,
      });
    }
    results.emby = 1;
  }

  revalidatePath('/settings');
  return {
    success: true,
    message: 'Settings imported successfully',
    createdOrUpdated: results,
  };
}
