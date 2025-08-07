'use server';

import { revalidatePath } from 'next/cache';
import { embySettingsService } from '@/lib/database';
import { EmbyService } from '@/lib/services/emby-service';
import {
  EmbySettingsCreateSchema,
  EmbySettingsUpdateSchema,
  createFormState,
  handleValidationErrors,
  handleServerError,
  type FormState,
} from '@/lib/validation/schemas';
import { ZodError } from 'zod';
import { EmbySettingsInput } from '@/lib/actions/settings/types';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';

// Emby Settings Actions (Single Instance)
export async function getEmbySettings(): Promise<EmbySettings | null> {
  try {
    const setting = await embySettingsService.get();
    return setting;
  } catch (error) {
    console.error('Failed to get Emby settings:', error);
    throw new Error('Failed to get Emby settings');
  }
}

export async function createEmbySetting(
  input: EmbySettingsInput
): Promise<FormState> {
  try {
    const validatedData = EmbySettingsCreateSchema.parse(input);

    const setting = await embySettingsService.create({
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      userId: validatedData.userId,
      enabled: validatedData.enabled,
      preferEmbyDateAdded: validatedData.preferEmbyDateAdded,
    });

    revalidatePath('/settings');

    return createFormState(
      true,
      'Emby setting created successfully',
      undefined,
      setting
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to create Emby setting');
  }
}

export async function updateEmbySetting(
  input: Partial<EmbySettingsInput>
): Promise<FormState> {
  try {
    const validatedData = EmbySettingsUpdateSchema.parse(input);

    const setting = await embySettingsService.update({
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      userId: validatedData.userId,
      enabled: validatedData.enabled,
      selectedFolders: validatedData.selectedFolders,
      preferEmbyDateAdded: validatedData.preferEmbyDateAdded,
    });

    revalidatePath('/settings');

    return createFormState(
      true,
      'Emby setting updated successfully',
      undefined,
      setting
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to update Emby setting');
  }
}

export async function deleteEmbySetting(): Promise<FormState> {
  try {
    await embySettingsService.delete();

    revalidatePath('/settings');

    return createFormState(true, 'Emby setting deleted successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to delete Emby setting');
  }
}

export async function testEmbyConnection() {
  try {
    const setting = await embySettingsService.get();
    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    // Test connection to the single Emby instance
    const isConnected = await EmbyService.testConnection(setting);
    return { success: isConnected };
  } catch (error) {
    console.error('Failed to test Emby connection:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to test Emby connection',
    };
  }
}
