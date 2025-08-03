'use server';

import { revalidatePath } from 'next/cache';
import { getAppSetting, setAppSetting } from './app-settings';
import type { DeletionScoreSettings } from './types';

const DEFAULT_DELETION_SCORE_SETTINGS: DeletionScoreSettings = {
  enabled: true,

  // Days Unwatched Factor
  // Higher scores for media that hasn't been watched recently
  // Breakpoints: 0 days (0%), 30 days (0%), 90 days (17%), 180 days (50%), 365 days (73%), 366+ days (100%)
  daysUnwatchedEnabled: true,
  daysUnwatchedMaxPoints: 30,
  daysUnwatchedBreakpoints: [
    { value: 30, percent: 0 },
    { value: 90, percent: 17 },
    { value: 180, percent: 50 },
    { value: 365, percent: 73 },
    { value: 366, percent: 100 },
  ],

  // Never Watched Bonus
  // Additional points for media that has never been watched
  neverWatchedEnabled: true,
  neverWatchedPoints: 20,

  // Size on Disk Factor
  // Higher scores for larger files to free up more storage space
  // Breakpoints: 0 GB (0%), 1 GB (0%), 5 GB (0%), 10 GB (29%), 20 GB (43%), 50 GB (71%), 51+ GB (100%)
  sizeOnDiskEnabled: true,
  sizeOnDiskMaxPoints: 35,
  sizeOnDiskBreakpoints: [
    { value: 1, percent: 0 },
    { value: 5, percent: 0 },
    { value: 10, percent: 29 },
    { value: 20, percent: 43 },
    { value: 50, percent: 71 },
    { value: 51, percent: 100 },
  ],

  // Age Since Added Factor
  // Higher scores for older media to protect recently added content
  // Breakpoints: 0 days (0%), 180 days (33%), 365 days (67%), 730+ days (100%)
  ageSinceAddedEnabled: true,
  ageSinceAddedMaxPoints: 15,
  ageSinceAddedBreakpoints: [
    { value: 180, percent: 33 },
    { value: 365, percent: 67 },
    { value: 730, percent: 100 },
  ],

  // Folder Space Factor
  // Higher scores for media in folders with limited remaining space
  // Breakpoints: 0% (0%), 10% (100%), 20% (80%), 30% (60%), 50% (30%)
  folderSpaceEnabled: false,
  folderSpaceMaxPoints: 10,
  folderSpaceBreakpoints: [
    { value: 10, percent: 100 },
    { value: 20, percent: 80 },
    { value: 30, percent: 60 },
    { value: 50, percent: 30 },
  ],
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
