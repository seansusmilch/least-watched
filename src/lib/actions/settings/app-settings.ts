'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { deletionScoreService } from '@/lib/services/deletion-score-service';
import { kvSettingsStore } from '@/lib/utils/kv-settings';
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
    const datePreference =
      ((await kvSettingsStore.get(
        'date-preference'
      )) as DatePreference | null) || DEFAULT_SETTINGS.datePreference;
    return { datePreference };
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
      await kvSettingsStore.set(
        'date-preference',
        validatedSettings.datePreference,
        'Date preference for media items (arr, emby, oldest)'
      );
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
    const value = (await kvSettingsStore.get(
      'date-preference'
    )) as DatePreference | null;
    return value || 'arr';
  } catch (error) {
    console.error('Error getting date preference:', error);
    return 'arr';
  }
}

/**
 * Centralized function to trigger deletion score recalculation if deletion scoring is enabled
 */
export async function triggerDeletionScoreRecalculation(): Promise<{
  success: boolean;
  message: string;
  recalculationTriggered: boolean;
}> {
  try {
    // Import here to avoid circular dependency
    const { getDeletionScoreSettings } = await import('./deletion-score');
    const deletionScoreSettings = await getDeletionScoreSettings();

    if (!deletionScoreSettings.enabled) {
      return {
        success: true,
        message: 'Settings updated successfully. Deletion scoring is disabled.',
        recalculationTriggered: false,
      };
    }

    // Trigger recalculation in the background if deletion scoring is enabled
    deletionScoreService.recalculateAllDeletionScores().catch((error) => {
      console.error('Background deletion score recalculation failed:', error);
    });

    return {
      success: true,
      message:
        'Settings updated successfully. Deletion scores are being recalculated in the background.',
      recalculationTriggered: true,
    };
  } catch (error) {
    console.error('Error during deletion score recalculation trigger:', error);
    return {
      success: true,
      message:
        'Settings updated successfully, but deletion score recalculation could not be triggered.',
      recalculationTriggered: false,
    };
  }
}

/**
 * Update just the date preference setting
 */
export async function updateDatePreference(datePreference: DatePreference) {
  try {
    await kvSettingsStore.set(
      'date-preference',
      datePreference,
      'Date preference for media items (arr, emby, oldest)'
    );

    revalidatePath('/settings');

    // Trigger deletion score recalculation since date preference affects age calculations
    const recalculationResult = await triggerDeletionScoreRecalculation();

    return {
      success: true,
      message: recalculationResult.message,
      recalculationTriggered: recalculationResult.recalculationTriggered,
    };
  } catch (error) {
    console.error('Error updating date preference:', error);
    return {
      success: false,
      error: 'Failed to update date preference',
      recalculationTriggered: false,
    };
  }
}

/**
 * Get a specific app setting by key
 */
export async function getAppSetting(key: string) {
  try {
    // For compatibility; prefer using kvSettingsStore directly elsewhere
    const value = await kvSettingsStore.get(key);
    return value
      ? {
          key,
          value,
          description: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        }
      : null;
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
    await kvSettingsStore.set(data.key, data.value, data.description);

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error setting app setting:', error);
    return { success: false, error: 'Failed to set app setting' };
  }
}
