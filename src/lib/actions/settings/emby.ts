'use server';

import { revalidatePath } from 'next/cache';
import { embySettingsService } from '../../database';
import { apiService } from '../../api';
import {
  EmbySettingsCreateSchema,
  EmbySettingsUpdateSchema,
  createFormState,
  handleValidationErrors,
  handleServerError,
  type FormState,
} from '../../validation/schemas';
import { ZodError } from 'zod';
import { EmbySettingsInput } from './types';
import { type EmbySettings } from '../../utils/single-emby-settings';

export interface ConnectionTestResult {
  success: boolean;
  connected: boolean;
  error?: string;
}

// Emby Settings Actions (Single Instance)
export async function getEmbySettings(): Promise<EmbySettings[]> {
  try {
    const setting = await embySettingsService.get();
    return setting ? [setting] : [];
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

export async function deleteEmbySetting(): Promise<FormState> {
  try {
    await embySettingsService.delete();

    // Refresh API configuration
    await apiService.refreshConfig();

    revalidatePath('/settings');

    return createFormState(true, 'Emby setting deleted successfully');
  } catch (error) {
    return handleServerError(error, 'Failed to delete Emby setting');
  }
}

export async function testEmbyConnection(): Promise<ConnectionTestResult> {
  try {
    const setting = await embySettingsService.get();
    if (!setting) {
      return { success: false, connected: false, error: 'Setting not found' };
    }

    // Refresh API configuration to include this setting
    await apiService.refreshConfig();

    // Test connection to the single Emby instance
    const isConnected = await apiService.testEmbyConnection();
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
