'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import type { DatePreference } from '@/lib/types/media';

const DatePreferenceSchema = z.enum(['arr', 'emby', 'oldest']);

const AppSettingsSchema = z.object({
  datePreference: DatePreferenceSchema,
});

type AppSettings = z.infer<typeof AppSettingsSchema>;

const DEFAULT_SETTINGS: AppSettings = {
  datePreference: 'arr',
};

/**
 * Get the current app settings
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const datePreference = await prisma.appSettings.findUnique({
      where: { key: 'date-preference' },
    });

    return {
      datePreference:
        (datePreference?.value as DatePreference) ||
        DEFAULT_SETTINGS.datePreference,
    };
  } catch (error) {
    console.error('Error getting app settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update app settings
 */
export async function updateAppSettings(settings: Partial<AppSettings>) {
  try {
    const validatedSettings = AppSettingsSchema.partial().parse(settings);

    // Update date preference if provided
    if (validatedSettings.datePreference) {
      await prisma.appSettings.upsert({
        where: { key: 'date-preference' },
        update: { value: validatedSettings.datePreference },
        create: {
          key: 'date-preference',
          value: validatedSettings.datePreference,
          description: 'Date preference for media items (arr, emby, oldest)',
        },
      });
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating app settings:', error);
    return { success: false, error: 'Failed to update app settings' };
  }
}

/**
 * Get just the date preference setting
 */
export async function getDatePreference(): Promise<DatePreference> {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'date-preference' },
    });

    return (setting?.value as DatePreference) || 'arr';
  } catch (error) {
    console.error('Error getting date preference:', error);
    return 'arr';
  }
}

/**
 * Update just the date preference setting
 */
export async function updateDatePreference(datePreference: DatePreference) {
  try {
    await prisma.appSettings.upsert({
      where: { key: 'date-preference' },
      update: { value: datePreference },
      create: {
        key: 'date-preference',
        value: datePreference,
        description: 'Date preference for media items (arr, emby, oldest)',
      },
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating date preference:', error);
    return { success: false, error: 'Failed to update date preference' };
  }
}

/**
 * Get a specific app setting by key
 */
export async function getAppSetting(key: string) {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key },
    });
    return setting;
  } catch (error) {
    console.error('Error getting app setting:', error);
    return null;
  }
}

/**
 * Set a specific app setting
 */
export async function setAppSetting(data: {
  key: string;
  value: string;
  description?: string;
}) {
  try {
    await prisma.appSettings.upsert({
      where: { key: data.key },
      update: { value: data.value, description: data.description },
      create: {
        key: data.key,
        value: data.value,
        description: data.description,
      },
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error setting app setting:', error);
    return { success: false, error: 'Failed to set app setting' };
  }
}
