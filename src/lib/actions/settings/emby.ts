'use server';

import { revalidatePath } from 'next/cache';
import { embySettingsService } from '../../database';
import { apiService } from '../../api';
import { invalidateAfterSettingsChange } from '../../cache/data-cache';
import {
  EmbySettingsCreateSchema,
  EmbySettingsUpdateSchema,
  IdSchema,
  createFormState,
  handleValidationErrors,
  handleServerError,
  type FormState,
} from '../../validation/schemas';
import { ZodError } from 'zod';

// Emby Settings Actions
export async function getEmbySettings() {
  try {
    return await embySettingsService.getAll();
  } catch (error) {
    console.error('Failed to get Emby settings:', error);
    throw new Error('Failed to get Emby settings');
  }
}

export async function createEmbySetting(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      apiKey: formData.get('apiKey') as string,
      userId: formData.get('userId') as string,
      enabled: formData.get('enabled') === 'true',
      selectedFolders: formData.getAll('selectedFolders') as string[],
    };

    const validatedData = EmbySettingsCreateSchema.parse(rawData);

    const setting = await embySettingsService.create({
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      userId: validatedData.userId,
      enabled: validatedData.enabled,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    await invalidateAfterSettingsChange();

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
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      apiKey: formData.get('apiKey') as string,
      userId: formData.get('userId') as string,
      enabled: formData.get('enabled') === 'true',
      selectedFolders: formData.getAll('selectedFolders') as string[],
    };

    const validatedData = EmbySettingsUpdateSchema.parse(rawData);

    const setting = await embySettingsService.update(validatedData.id, {
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      userId: validatedData.userId,
      enabled: validatedData.enabled,
      selectedFolders: validatedData.selectedFolders,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    await invalidateAfterSettingsChange();

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

export async function deleteEmbySetting(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const id = formData.get('id') as string;
    const validatedId = IdSchema.parse(id);

    await embySettingsService.delete(validatedId);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    await invalidateAfterSettingsChange();

    return createFormState(true, 'Emby setting deleted successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to delete Emby setting');
  }
}

export async function testEmbyConnection(id: string) {
  try {
    const validatedId = IdSchema.parse(id);

    const setting = await embySettingsService.getById(validatedId);
    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    // Find the index of this setting in the enabled settings
    const enabledSettings = await embySettingsService.getEnabled();
    const configIndex = enabledSettings.findIndex((s) => s.id === validatedId);

    if (configIndex === -1) {
      return { success: false, error: 'Setting not enabled' };
    }

    const isConnected = await apiService.testEmbyConnection(configIndex);
    return { success: isConnected, connected: isConnected };
  } catch (error) {
    return handleServerError(error, 'Failed to test Emby connection');
  }
}
