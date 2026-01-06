'use server';

import { revalidatePath } from 'next/cache';
import { radarrSettingsService } from '../../database';
import { radarrApiClient } from '@/lib/services/radarr-service';
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
import { RadarrSettingsInput } from '@/lib/types/settings';

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
  input: RadarrSettingsInput
): Promise<FormState> {
  try {
    const validatedData = RadarrSettingsCreateSchema.parse(input);

    const setting = await radarrSettingsService.create({
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      enabled: validatedData.enabled,
    });

    revalidatePath('/settings');

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
  id: string,
  input: Partial<RadarrSettingsInput>
): Promise<FormState> {
  try {
    const validatedData = RadarrSettingsUpdateSchema.parse({
      id,
      ...input,
    });

    const setting = await radarrSettingsService.update(id, {
      name: validatedData.name,
      url: validatedData.url,
      apiKey: validatedData.apiKey,
      enabled: validatedData.enabled,
      selectedFolders: validatedData.selectedFolders,
    });

    revalidatePath('/settings');

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

export async function deleteRadarrSetting(id: string): Promise<FormState> {
  try {
    const validatedId = IdSchema.parse(id);

    await radarrSettingsService.delete(validatedId);

    revalidatePath('/settings');

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

    const success = await radarrApiClient.testConnection(setting);
    return { success };
  } catch (error) {
    console.error('Failed to test Radarr connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}
