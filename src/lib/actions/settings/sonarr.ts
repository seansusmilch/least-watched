'use server';

import { revalidatePath } from 'next/cache';
import { sonarrSettingsService } from '../../database';
import { apiService } from '../../api';
import {
  SonarrSettingsCreateSchema,
  SonarrSettingsUpdateSchema,
  IdSchema,
  createFormState,
  handleValidationErrors,
  handleServerError,
  type FormState,
} from '../../validation/schemas';
import { ZodError } from 'zod';
import { SonarrSettingsInput } from './types';

// Sonarr Settings Actions
export async function getSonarrSettings() {
  try {
    return await sonarrSettingsService.getAll();
  } catch (error) {
    console.error('Failed to get Sonarr settings:', error);
    throw new Error('Failed to get Sonarr settings');
  }
}

export async function createSonarrSetting(
  input: SonarrSettingsInput
): Promise<FormState> {
  try {
    const validatedData = SonarrSettingsCreateSchema.parse(input);

    const setting = await sonarrSettingsService.create({
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      enabled: validatedData.enabled,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');

    return createFormState(
      true,
      'Sonarr setting created successfully',
      undefined,
      setting
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to create Sonarr setting');
  }
}

export async function updateSonarrSetting(
  id: string,
  input: Partial<SonarrSettingsInput>
): Promise<FormState> {
  try {
    const validatedData = SonarrSettingsUpdateSchema.parse({
      id,
      ...input,
    });

    const setting = await sonarrSettingsService.update(id, {
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      enabled: validatedData.enabled,
      selectedFolders: validatedData.selectedFolders,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');

    return createFormState(
      true,
      'Sonarr setting updated successfully',
      undefined,
      setting
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to update Sonarr setting');
  }
}

export async function deleteSonarrSetting(id: string): Promise<FormState> {
  try {
    const validatedId = IdSchema.parse(id);

    await sonarrSettingsService.delete(validatedId);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');

    return createFormState(true, 'Sonarr setting deleted successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to delete Sonarr setting');
  }
}

export async function testSonarrConnection(id: string) {
  try {
    const validatedId = IdSchema.parse(id);

    const setting = await sonarrSettingsService.getById(validatedId);
    if (!setting) {
      return { success: false, error: 'Setting not found' };
    }

    // Refresh API configuration to include this setting
    await apiService.refreshConfig();

    // Find the index of this setting in the enabled settings
    const enabledSettings = await sonarrSettingsService.getEnabled();
    const configIndex = enabledSettings.findIndex((s) => s.id === validatedId);

    if (configIndex === -1) {
      return { success: false, error: 'Setting not enabled' };
    }

    const isConnected = await apiService.testSonarrConnection(configIndex);
    return { success: isConnected, connected: isConnected };
  } catch (error) {
    return handleServerError(error, 'Failed to test Sonarr connection');
  }
}
