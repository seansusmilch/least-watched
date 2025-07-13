'use server';

import { revalidatePath } from 'next/cache';
import { radarrSettingsService } from '../../database';
import { apiService } from '../../api';
import { invalidateAfterSettingsChange } from '../../cache/data-cache';
import {
  RadarrSettingsCreateSchema,
  RadarrSettingsUpdateSchema,
  IdSchema,
  createFormState,
  handleValidationErrors,
  handleServerError,
  type FormState,
} from '../../validation/schemas';
import { ZodError } from 'zod';

// Radarr Settings Actions
export async function getRadarrSettings() {
  try {
    return await radarrSettingsService.getAll();
  } catch (error) {
    console.error('Failed to get Radarr settings:', error);
    throw new Error('Failed to get Radarr settings');
  }
}

export async function createRadarrSetting(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      apiKey: formData.get('apiKey') as string,
      enabled: formData.get('enabled') === 'true',
      selectedFolders: formData.getAll('selectedFolders') as string[],
    };

    const validatedData = RadarrSettingsCreateSchema.parse(rawData);

    const setting = await radarrSettingsService.create({
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      enabled: validatedData.enabled,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    await invalidateAfterSettingsChange();

    return createFormState(
      true,
      'Radarr setting created successfully',
      undefined,
      setting
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to create Radarr setting');
  }
}

export async function updateRadarrSetting(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      apiKey: formData.get('apiKey') as string,
      enabled: formData.get('enabled') === 'true',
      selectedFolders: formData.getAll('selectedFolders') as string[],
    };

    const validatedData = RadarrSettingsUpdateSchema.parse(rawData);

    const setting = await radarrSettingsService.update(validatedData.id, {
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      enabled: validatedData.enabled,
      selectedFolders: validatedData.selectedFolders,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    await invalidateAfterSettingsChange();

    return createFormState(
      true,
      'Radarr setting updated successfully',
      undefined,
      setting
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to update Radarr setting');
  }
}

export async function deleteRadarrSetting(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    const id = formData.get('id') as string;
    const validatedId = IdSchema.parse(id);

    await radarrSettingsService.delete(validatedId);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');
    await invalidateAfterSettingsChange();

    return createFormState(true, 'Radarr setting deleted successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to delete Radarr setting');
  }
}

export async function testRadarrConnection(id: string) {
  try {
    const validatedId = IdSchema.parse(id);

    const setting = await radarrSettingsService.getById(validatedId);
    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    // Find the index of this setting in the enabled settings
    const enabledSettings = await radarrSettingsService.getEnabled();
    const configIndex = enabledSettings.findIndex((s) => s.id === validatedId);

    if (configIndex === -1) {
      return { success: false, error: 'Setting not enabled' };
    }

    const isConnected = await apiService.testRadarrConnection(configIndex);
    return { success: isConnected, connected: isConnected };
  } catch (error) {
    return handleServerError(error, 'Failed to test Radarr connection');
  }
}
