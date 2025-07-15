'use server';

import { revalidatePath } from 'next/cache';
import { getAppSetting, setAppSetting } from './app-settings';
import type { DeletionScoreSettings } from './types';

// Deletion Score Settings
export async function getDeletionScoreSettings(): Promise<DeletionScoreSettings> {
  try {
    const setting = await getAppSetting('deletionScoreSettings');

    if (setting?.value) {
      return JSON.parse(setting.value);
    }

    // Return defaults that match current hardcoded values
    return {
      enabled: true,

      // Days Unwatched Factor
      daysUnwatchedEnabled: true,
      daysUnwatchedMaxPoints: 35,
      daysUnwatched30Days: 0,
      daysUnwatched90Days: 10,
      daysUnwatched180Days: 15,
      daysUnwatched365Days: 25,
      daysUnwatchedOver365: 35,

      // Never Watched Bonus
      neverWatchedEnabled: true,
      neverWatchedPoints: 20,

      // Size on Disk Factor
      sizeOnDiskEnabled: true,
      sizeOnDiskMaxPoints: 30,
      sizeOnDisk1GB: 0,
      sizeOnDisk5GB: 10,
      sizeOnDisk10GB: 15,
      sizeOnDisk20GB: 20,
      sizeOnDisk50GB: 25,
      sizeOnDiskOver50GB: 30,

      // Age Since Added Factor
      ageSinceAddedEnabled: true,
      ageSinceAddedMaxPoints: 15,
      ageSinceAdded180Days: 5,
      ageSinceAdded365Days: 10,
      ageSinceAddedOver730: 15,

      // Folder Space Factor
      folderSpaceEnabled: true,
      folderSpaceMaxPoints: 20,
      folderSpace10Percent: 20,
      folderSpace20Percent: 15,
      folderSpace30Percent: 10,
      folderSpace50Percent: 5,
    };
  } catch (error) {
    console.error('Failed to get deletion score settings:', error);
    // Return defaults on error
    return await getDeletionScoreSettings();
  }
}

export async function setDeletionScoreSettings(
  settings: DeletionScoreSettings
): Promise<{ success: boolean; message: string }> {
  try {
    await setAppSetting({
      key: 'deletionScoreSettings',
      value: JSON.stringify(settings),
      description:
        'Deletion score calculation settings for media prioritization',
    });

    // Invalidate deletion score cache when settings change
    const { deletionScoreCalculator } = await import(
      '../../deletion-score-calculator'
    );
    deletionScoreCalculator.invalidateCache();

    // Trigger recalculation in the background if deletion scoring is enabled
    if (settings.enabled) {
      // Import and trigger recalculation without waiting for completion
      const { deletionScoreService } = await import(
        '../../services/deletion-score-service'
      );

      // Fire and forget - don't wait for completion
      deletionScoreService.recalculateAllDeletionScores().catch((error) => {
        console.error('Background deletion score recalculation failed:', error);
      });
    }

    revalidatePath('/settings');
    return {
      success: true,
      message:
        'Deletion score settings updated successfully. Scores are being recalculated in the background.',
    };
  } catch (error) {
    console.error('Failed to set deletion score settings:', error);
    return {
      success: false,
      message: 'Failed to update deletion score settings',
    };
  }
}
