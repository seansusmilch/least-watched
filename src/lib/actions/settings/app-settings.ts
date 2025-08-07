'use server';

import { revalidatePath } from 'next/cache';
import { appSettingsService } from '@/lib/database';
import type {
  AppSettingsInput,
  BatchSettings,
  EnhancedProcessingSettings,
} from '@/lib/actions/settings/types';

// App Settings Actions
export async function getAppSettings() {
  try {
    return await appSettingsService.getAll();
  } catch (error) {
    console.error('Failed to get app settings:', error);
    throw new Error('Failed to get app settings');
  }
}

export async function getAppSetting(key: string) {
  try {
    return await appSettingsService.getByKey(key);
  } catch (error) {
    console.error('Failed to get app setting:', error);
    throw new Error('Failed to get app setting');
  }
}

export async function setAppSetting(data: AppSettingsInput) {
  try {
    const setting = await appSettingsService.setValue(
      data.key,
      data.value,
      data.description
    );

    revalidatePath('/settings');
    return { success: true, data: setting };
  } catch (error) {
    console.error('Failed to set app setting:', error);
    return { success: false, error: 'Failed to set app setting' };
  }
}

export async function deleteAppSetting(key: string) {
  try {
    await appSettingsService.delete(key);

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete app setting:', error);
    return { success: false, error: 'Failed to delete app setting' };
  }
}

export async function getBatchSettings(): Promise<BatchSettings> {
  try {
    const batchSize =
      (await appSettingsService.getValue('batch_size', '50')) || '50';
    const delayBetweenBatches =
      (await appSettingsService.getValue('batch_delay', '1000')) || '1000';

    return {
      batchSize: parseInt(batchSize, 10),
      delayBetweenBatches: parseInt(delayBetweenBatches, 10),
    };
  } catch (error) {
    console.error('Error getting batch settings:', error);
    return {
      batchSize: 50,
      delayBetweenBatches: 1000,
    };
  }
}

export async function setBatchSettings(
  settings: BatchSettings
): Promise<{ success: boolean; message: string }> {
  try {
    await setAppSetting({
      key: 'batchSize',
      value: settings.batchSize.toString(),
      description: 'Number of items to process in each batch',
    });

    await setAppSetting({
      key: 'delayBetweenBatches',
      value: settings.delayBetweenBatches.toString(),
      description: 'Delay between batches in milliseconds',
    });

    revalidatePath('/settings');
    return { success: true, message: 'Batch settings updated successfully' };
  } catch (error) {
    console.error('Failed to set batch settings:', error);
    return { success: false, message: 'Failed to update batch settings' };
  }
}

// Enhanced Media Processing Settings
export async function getEnhancedProcessingSettings(): Promise<EnhancedProcessingSettings> {
  try {
    const [
      deletionScoring,
      detailedMetadata,
      qualityAnalysis,
      playbackProgress,
    ] = await Promise.all([
      getAppSetting('enableDeletionScoring'),
      getAppSetting('enableDetailedMetadata'),
      getAppSetting('enableQualityAnalysis'),
      getAppSetting('enablePlaybackProgress'),
    ]);

    return {
      enableDeletionScoring: deletionScoring
        ? deletionScoring.value === 'true'
        : true,
      enableDetailedMetadata: detailedMetadata
        ? detailedMetadata.value === 'true'
        : true,
      enableQualityAnalysis: qualityAnalysis
        ? qualityAnalysis.value === 'true'
        : true,
      enablePlaybackProgress: playbackProgress
        ? playbackProgress.value === 'true'
        : true,
    };
  } catch (error) {
    console.error('Failed to get enhanced processing settings:', error);
    // Return defaults
    return {
      enableDeletionScoring: true,
      enableDetailedMetadata: true,
      enableQualityAnalysis: true,
      enablePlaybackProgress: true,
    };
  }
}

export async function setEnhancedProcessingSettings(
  settings: EnhancedProcessingSettings
): Promise<{ success: boolean; message: string }> {
  try {
    await Promise.all([
      setAppSetting({
        key: 'enableDeletionScoring',
        value: settings.enableDeletionScoring.toString(),
        description: 'Enable deletion priority scoring for media items',
      }),
      setAppSetting({
        key: 'enableDetailedMetadata',
        value: settings.enableDetailedMetadata.toString(),
        description: 'Fetch detailed metadata (ratings, genres, overview)',
      }),
      setAppSetting({
        key: 'enableQualityAnalysis',
        value: settings.enableQualityAnalysis.toString(),
        description:
          'Analyze quality profiles and calculate efficiency metrics',
      }),
      setAppSetting({
        key: 'enablePlaybackProgress',
        value: settings.enablePlaybackProgress.toString(),
        description: 'Fetch detailed playback progress from Emby',
      }),
    ]);

    revalidatePath('/settings');
    return {
      success: true,
      message: 'Enhanced processing settings updated successfully',
    };
  } catch (error) {
    console.error('Failed to set enhanced processing settings:', error);
    return {
      success: false,
      message: 'Failed to update enhanced processing settings',
    };
  }
}
