'use server';

import { revalidatePath } from 'next/cache';
import {
  getAppSetting,
  setAppSetting,
  triggerDeletionScoreRecalculation,
} from './app-settings';
import type { DeletionScoreSettings, Breakpoint } from './types';
import { appSettingsService } from '@/lib/database';

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

// Helper function to get a setting value with fallback
async function getSettingValue(
  key: string,
  defaultValue: string
): Promise<string> {
  try {
    const setting = await getAppSetting(key);
    return setting?.value || defaultValue;
  } catch (error) {
    console.warn(`Failed to get setting ${key}:`, error);
    return defaultValue;
  }
}

// Helper function to get a boolean setting
async function getBooleanSetting(
  key: string,
  defaultValue: boolean
): Promise<boolean> {
  const value = await getSettingValue(key, defaultValue.toString());
  return value === 'true';
}

// Helper function to get a number setting
async function getNumberSetting(
  key: string,
  defaultValue: number
): Promise<number> {
  const value = await getSettingValue(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Helper function to get breakpoints from JSON
async function getBreakpointsSetting(
  key: string,
  defaultValue: Breakpoint[]
): Promise<Breakpoint[]> {
  try {
    const value = await getSettingValue(key, JSON.stringify(defaultValue));
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse breakpoints for ${key}:`, error);
    return defaultValue;
  }
}

// Helper function to set a setting value
async function setSettingValue(
  key: string,
  value: string,
  description?: string
): Promise<void> {
  await setAppSetting({
    key,
    value,
    description,
  });
}

// Helper function to set a boolean setting
async function setBooleanSetting(
  key: string,
  value: boolean,
  description?: string
): Promise<void> {
  await setSettingValue(key, value.toString(), description);
}

// Helper function to set a number setting
async function setNumberSetting(
  key: string,
  value: number,
  description?: string
): Promise<void> {
  await setSettingValue(key, value.toString(), description);
}

// Helper function to set breakpoints as JSON
async function setBreakpointsSetting(
  key: string,
  breakpoints: Breakpoint[],
  description?: string
): Promise<void> {
  await setSettingValue(key, JSON.stringify(breakpoints), description);
}

// Deletion Score Settings
export async function getDeletionScoreSettings(): Promise<DeletionScoreSettings> {
  try {
    // Load from flattened keys
    return {
      enabled: await getBooleanSetting(
        'deletion_score.enabled',
        DEFAULT_DELETION_SCORE_SETTINGS.enabled
      ),
      daysUnwatchedEnabled: await getBooleanSetting(
        'deletion_score.days_unwatched.enabled',
        DEFAULT_DELETION_SCORE_SETTINGS.daysUnwatchedEnabled
      ),
      daysUnwatchedMaxPoints: await getNumberSetting(
        'deletion_score.days_unwatched.max_points',
        DEFAULT_DELETION_SCORE_SETTINGS.daysUnwatchedMaxPoints
      ),
      daysUnwatchedBreakpoints: await getBreakpointsSetting(
        'deletion_score.days_unwatched.breakpoints',
        DEFAULT_DELETION_SCORE_SETTINGS.daysUnwatchedBreakpoints
      ),
      neverWatchedEnabled: await getBooleanSetting(
        'deletion_score.never_watched.enabled',
        DEFAULT_DELETION_SCORE_SETTINGS.neverWatchedEnabled
      ),
      neverWatchedPoints: await getNumberSetting(
        'deletion_score.never_watched.points',
        DEFAULT_DELETION_SCORE_SETTINGS.neverWatchedPoints
      ),
      sizeOnDiskEnabled: await getBooleanSetting(
        'deletion_score.size_on_disk.enabled',
        DEFAULT_DELETION_SCORE_SETTINGS.sizeOnDiskEnabled
      ),
      sizeOnDiskMaxPoints: await getNumberSetting(
        'deletion_score.size_on_disk.max_points',
        DEFAULT_DELETION_SCORE_SETTINGS.sizeOnDiskMaxPoints
      ),
      sizeOnDiskBreakpoints: await getBreakpointsSetting(
        'deletion_score.size_on_disk.breakpoints',
        DEFAULT_DELETION_SCORE_SETTINGS.sizeOnDiskBreakpoints
      ),
      ageSinceAddedEnabled: await getBooleanSetting(
        'deletion_score.age_since_added.enabled',
        DEFAULT_DELETION_SCORE_SETTINGS.ageSinceAddedEnabled
      ),
      ageSinceAddedMaxPoints: await getNumberSetting(
        'deletion_score.age_since_added.max_points',
        DEFAULT_DELETION_SCORE_SETTINGS.ageSinceAddedMaxPoints
      ),
      ageSinceAddedBreakpoints: await getBreakpointsSetting(
        'deletion_score.age_since_added.breakpoints',
        DEFAULT_DELETION_SCORE_SETTINGS.ageSinceAddedBreakpoints
      ),
      folderSpaceEnabled: await getBooleanSetting(
        'deletion_score.folder_space.enabled',
        DEFAULT_DELETION_SCORE_SETTINGS.folderSpaceEnabled
      ),
      folderSpaceMaxPoints: await getNumberSetting(
        'deletion_score.folder_space.max_points',
        DEFAULT_DELETION_SCORE_SETTINGS.folderSpaceMaxPoints
      ),
      folderSpaceBreakpoints: await getBreakpointsSetting(
        'deletion_score.folder_space.breakpoints',
        DEFAULT_DELETION_SCORE_SETTINGS.folderSpaceBreakpoints
      ),
    };
  } catch (error) {
    console.error('Failed to get deletion score settings:', error);
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

    // Store settings in flattened format
    await setBooleanSetting(
      'deletion_score.enabled',
      settings.enabled,
      'Enable deletion scoring'
    );

    await setBooleanSetting(
      'deletion_score.days_unwatched.enabled',
      settings.daysUnwatchedEnabled,
      'Enable days unwatched factor'
    );
    await setNumberSetting(
      'deletion_score.days_unwatched.max_points',
      settings.daysUnwatchedMaxPoints,
      'Days unwatched max points'
    );
    await setBreakpointsSetting(
      'deletion_score.days_unwatched.breakpoints',
      settings.daysUnwatchedBreakpoints,
      'Days unwatched breakpoints'
    );

    await setBooleanSetting(
      'deletion_score.never_watched.enabled',
      settings.neverWatchedEnabled,
      'Enable never watched bonus'
    );
    await setNumberSetting(
      'deletion_score.never_watched.points',
      settings.neverWatchedPoints,
      'Never watched bonus points'
    );

    await setBooleanSetting(
      'deletion_score.size_on_disk.enabled',
      settings.sizeOnDiskEnabled,
      'Enable size on disk factor'
    );
    await setNumberSetting(
      'deletion_score.size_on_disk.max_points',
      settings.sizeOnDiskMaxPoints,
      'Size on disk max points'
    );
    await setBreakpointsSetting(
      'deletion_score.size_on_disk.breakpoints',
      settings.sizeOnDiskBreakpoints,
      'Size on disk breakpoints'
    );

    await setBooleanSetting(
      'deletion_score.age_since_added.enabled',
      settings.ageSinceAddedEnabled,
      'Enable age since added factor'
    );
    await setNumberSetting(
      'deletion_score.age_since_added.max_points',
      settings.ageSinceAddedMaxPoints,
      'Age since added max points'
    );
    await setBreakpointsSetting(
      'deletion_score.age_since_added.breakpoints',
      settings.ageSinceAddedBreakpoints,
      'Age since added breakpoints'
    );

    await setBooleanSetting(
      'deletion_score.folder_space.enabled',
      settings.folderSpaceEnabled,
      'Enable folder space factor'
    );
    await setNumberSetting(
      'deletion_score.folder_space.max_points',
      settings.folderSpaceMaxPoints,
      'Folder space max points'
    );
    await setBreakpointsSetting(
      'deletion_score.folder_space.breakpoints',
      settings.folderSpaceBreakpoints,
      'Folder space breakpoints'
    );

    // Use centralized recalculation function
    const recalculationResult = await triggerDeletionScoreRecalculation();

    revalidatePath('/settings');
    return {
      success: true,
      message: recalculationResult.message,
    };
  } catch (error) {
    console.error('Failed to set deletion score settings:', error);
    return {
      success: false,
      message: 'Failed to update deletion score settings',
    };
  }
}

// Utility function to list all deletion score settings (for debugging)
export async function listDeletionScoreSettings(): Promise<
  { key: string; value: string; description?: string }[]
> {
  try {
    const allSettings = await appSettingsService.getAll();

    return allSettings
      .filter((setting) => setting.key.startsWith('deletion_score.'))
      .map((setting) => ({
        key: setting.key,
        value: setting.value,
        description: setting.description || undefined,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  } catch (error) {
    console.error('Failed to list deletion score settings:', error);
    return [];
  }
}
