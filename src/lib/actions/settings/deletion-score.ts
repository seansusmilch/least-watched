'use server';

import { revalidatePath } from 'next/cache';
import { getAppSetting, setAppSetting } from './app-settings';
import type { DeletionScoreSettings } from './types';

const DEFAULT_DELETION_SCORE_SETTINGS: DeletionScoreSettings = {
  enabled: true,

  // Days Unwatched Factor
  daysUnwatchedEnabled: true,
  daysUnwatchedMaxPoints: 30,
  daysUnwatched30DaysPercent: 0, // 0% of max points
  daysUnwatched90DaysPercent: 16.67, // ~5/30 = 16.67%
  daysUnwatched180DaysPercent: 50, // 15/30 = 50%
  daysUnwatched365DaysPercent: 73.33, // 22/30 = 73.33%
  daysUnwatchedOver365Percent: 100, // 30/30 = 100%

  // Never Watched Bonus
  neverWatchedEnabled: true,
  neverWatchedPoints: 20,

  // Size on Disk Factor
  sizeOnDiskEnabled: true,
  sizeOnDiskMaxPoints: 35,
  sizeOnDisk1GBPercent: 0, // 0% of max points
  sizeOnDisk5GBPercent: 0, // 0% of max points
  sizeOnDisk10GBPercent: 28.57, // 10/35 = 28.57%
  sizeOnDisk20GBPercent: 42.86, // 15/35 = 42.86%
  sizeOnDisk50GBPercent: 71.43, // 25/35 = 71.43%
  sizeOnDiskOver50GBPercent: 100, // 35/35 = 100%

  // Age Since Added Factor
  ageSinceAddedEnabled: true,
  ageSinceAddedMaxPoints: 15,
  ageSinceAdded180DaysPercent: 33.33, // 5/15 = 33.33%
  ageSinceAdded365DaysPercent: 66.67, // 10/15 = 66.67%
  ageSinceAddedOver730Percent: 100, // 15/15 = 100%

  // Folder Space Factor
  folderSpaceEnabled: false,
  folderSpaceMaxPoints: 10,
  folderSpace10PercentPercent: 100, // 10/10 = 100%
  folderSpace20PercentPercent: 80, // 8/10 = 80%
  folderSpace30PercentPercent: 60, // 6/10 = 60%
  folderSpace50PercentPercent: 30, // 3/10 = 30%
};

// Deletion Score Settings
export async function getDeletionScoreSettings(): Promise<DeletionScoreSettings> {
  try {
    const setting = await getAppSetting('deletionScoreSettings');

    if (setting?.value) {
      const loadedSettings = JSON.parse(setting.value);

      // Ensure all required properties exist by merging with defaults
      const validatedSettings = {
        ...DEFAULT_DELETION_SCORE_SETTINGS,
        ...loadedSettings,
      };

      return validatedSettings;
    }

    // Return defaults that match current hardcoded values
    return DEFAULT_DELETION_SCORE_SETTINGS;
  } catch (error) {
    console.error('Failed to get deletion score settings:', error);
    // Return defaults on error instead of recursive call
    return DEFAULT_DELETION_SCORE_SETTINGS;
  }
}

export async function setDeletionScoreSettings(
  settings: DeletionScoreSettings
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate that enabled factors add up to 100 points
    if (settings.enabled) {
      let totalPoints = 0;

      if (settings.daysUnwatchedEnabled) {
        totalPoints += settings.daysUnwatchedMaxPoints;
      }
      if (settings.neverWatchedEnabled) {
        totalPoints += settings.neverWatchedPoints;
      }
      if (settings.sizeOnDiskEnabled) {
        totalPoints += settings.sizeOnDiskMaxPoints;
      }
      if (settings.ageSinceAddedEnabled) {
        totalPoints += settings.ageSinceAddedMaxPoints;
      }
      if (settings.folderSpaceEnabled) {
        totalPoints += settings.folderSpaceMaxPoints;
      }

      if (totalPoints !== 100) {
        return {
          success: false,
          message: `Deletion score factors must add up to exactly 100 points. Current total: ${totalPoints} points. Please adjust your settings.`,
        };
      }
    }

    await setAppSetting({
      key: 'deletionScoreSettings',
      value: JSON.stringify(settings),
      description:
        'Deletion score calculation settings for media prioritization',
    });

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
