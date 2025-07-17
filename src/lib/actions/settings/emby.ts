'use server';

import { revalidatePath } from 'next/cache';
import { embySettingsService } from '../../database';
import { apiService } from '../../api';
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
import { EmbySettingsInput } from './types';

export interface ConnectionTestResult {
  success: boolean;
  connected: boolean;
  error?: string;
}

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

    // Refresh API configuration
    await apiService.refreshConfig();

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
  id: string,
  input: Partial<EmbySettingsInput>
): Promise<FormState> {
  try {
    const validatedData = EmbySettingsUpdateSchema.parse({
      id,
      ...input,
    });

    const setting = await embySettingsService.update(id, {
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      userId: validatedData.userId,
      enabled: validatedData.enabled,
      selectedFolders: validatedData.selectedFolders,
      preferEmbyDateAdded: validatedData.preferEmbyDateAdded,
    });

    // Refresh API configuration
    await apiService.refreshConfig();

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

export async function deleteEmbySetting(id: string): Promise<FormState> {
  try {
    const validatedId = IdSchema.parse(id);

    await embySettingsService.delete(validatedId);

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');

    return createFormState(true, 'Emby setting deleted successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationErrors(error);
    }
    return handleServerError(error, 'Failed to delete Emby setting');
  }
}

export async function testEmbyConnection(
  id: string
): Promise<ConnectionTestResult> {
  try {
    const validatedId = IdSchema.parse(id);

    const setting = await embySettingsService.getById(validatedId);
    if (!setting) {
      return { success: false, connected: false, error: 'Setting not found' };
    }

    // Refresh API configuration to include this setting
    await apiService.refreshConfig();

    // Find the index of this setting in the enabled settings
    const enabledSettings = await embySettingsService.getEnabled();
    const configIndex = enabledSettings.findIndex((s) => s.id === validatedId);

    if (configIndex === -1) {
      return { success: false, connected: false, error: 'Setting not enabled' };
    }

    const isConnected = await apiService.testEmbyConnection(configIndex);
    return {
      success: true,
      connected: isConnected,
      error: isConnected ? undefined : 'Connection failed',
    };
  } catch (error) {
    console.error('Failed to test Emby connection:', error);
    return {
      success: false,
      connected: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to test Emby connection',
    };
  }
}
