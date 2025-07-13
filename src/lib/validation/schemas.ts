import { z } from 'zod';

// Common validation schemas
export const IdSchema = z.string().min(1, 'ID is required');

export const UrlSchema = z
  .string()
  .url('Please enter a valid URL')
  .min(1, 'URL is required');

export const ApiKeySchema = z
  .string()
  .min(1, 'API key is required')
  .max(100, 'API key is too long');

export const NameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters');

// Sonarr Settings Schemas
export const SonarrSettingsCreateSchema = z.object({
  name: NameSchema,
  url: UrlSchema,
  apiKey: ApiKeySchema,
  enabled: z.boolean().default(true),
  selectedFolders: z.array(z.string()).optional(),
});

export const SonarrSettingsUpdateSchema = z.object({
  id: IdSchema,
  name: NameSchema.optional(),
  url: UrlSchema.optional(),
  apiKey: ApiKeySchema.optional(),
  enabled: z.boolean().optional(),
  selectedFolders: z.array(z.string()).optional(),
});

// Radarr Settings Schemas
export const RadarrSettingsCreateSchema = z.object({
  name: NameSchema,
  url: UrlSchema,
  apiKey: ApiKeySchema,
  enabled: z.boolean().default(true),
  selectedFolders: z.array(z.string()).optional(),
});

export const RadarrSettingsUpdateSchema = z.object({
  id: IdSchema,
  name: NameSchema.optional(),
  url: UrlSchema.optional(),
  apiKey: ApiKeySchema.optional(),
  enabled: z.boolean().optional(),
  selectedFolders: z.array(z.string()).optional(),
});

// Emby Settings Schemas
export const EmbySettingsCreateSchema = z.object({
  name: NameSchema,
  url: UrlSchema,
  apiKey: ApiKeySchema,
  userId: z.string().optional(),
  enabled: z.boolean().default(true),
  selectedFolders: z.array(z.string()).optional(),
});

export const EmbySettingsUpdateSchema = z.object({
  id: IdSchema,
  name: NameSchema.optional(),
  url: UrlSchema.optional(),
  apiKey: ApiKeySchema.optional(),
  userId: z.string().optional(),
  enabled: z.boolean().optional(),
  selectedFolders: z.array(z.string()).optional(),
});

// App Settings Schemas
export const AppSettingsSchema = z.object({
  key: z.string().min(1, 'Key is required').max(50, 'Key is too long'),
  value: z.string().min(1, 'Value is required').max(1000, 'Value is too long'),
  description: z.string().max(200, 'Description is too long').optional(),
});

// Batch Settings Schema
export const BatchSettingsSchema = z.object({
  batchSize: z
    .number()
    .min(1, 'Batch size must be at least 1')
    .max(1000, 'Batch size cannot exceed 1000'),
  delayBetweenBatches: z
    .number()
    .min(0, 'Delay cannot be negative')
    .max(60000, 'Delay cannot exceed 60 seconds'),
});

// Enhanced Processing Settings Schema
export const EnhancedProcessingSettingsSchema = z.object({
  enableDeletionScoring: z.boolean(),
  enableDetailedMetadata: z.boolean(),
  enableQualityAnalysis: z.boolean(),
  enablePlaybackProgress: z.boolean(),
});

// Deletion Score Settings Schema
export const DeletionScoreSettingsSchema = z.object({
  enabled: z.boolean(),

  // Days Unwatched Factor
  daysUnwatchedEnabled: z.boolean(),
  daysUnwatchedMaxPoints: z.number().min(0).max(100),
  daysUnwatched30Days: z.number().min(0).max(100),
  daysUnwatched90Days: z.number().min(0).max(100),
  daysUnwatched180Days: z.number().min(0).max(100),
  daysUnwatched365Days: z.number().min(0).max(100),
  daysUnwatchedOver365: z.number().min(0).max(100),

  // Never Watched Bonus
  neverWatchedEnabled: z.boolean(),
  neverWatchedPoints: z.number().min(0).max(100),

  // Size on Disk Factor
  sizeOnDiskEnabled: z.boolean(),
  sizeOnDiskMaxPoints: z.number().min(0).max(100),
  sizeOnDisk1GB: z.number().min(0).max(100),
  sizeOnDisk5GB: z.number().min(0).max(100),
  sizeOnDisk10GB: z.number().min(0).max(100),
  sizeOnDisk20GB: z.number().min(0).max(100),
  sizeOnDisk50GB: z.number().min(0).max(100),
  sizeOnDiskOver50GB: z.number().min(0).max(100),

  // Age Since Added Factor
  ageSinceAddedEnabled: z.boolean(),
  ageSinceAddedMaxPoints: z.number().min(0).max(100),
  ageSinceAdded180Days: z.number().min(0).max(100),
  ageSinceAdded365Days: z.number().min(0).max(100),
  ageSinceAddedOver730: z.number().min(0).max(100),

  // Folder Space Factor
  folderSpaceEnabled: z.boolean(),
  folderSpaceMaxPoints: z.number().min(0).max(100),
  folderSpace10Percent: z.number().min(0).max(100),
  folderSpace20Percent: z.number().min(0).max(100),
  folderSpace30Percent: z.number().min(0).max(100),
  folderSpace50Percent: z.number().min(0).max(100),
});

// Media Processing Schema
export const MediaProcessingSchema = z.object({
  progressId: z.string().uuid().optional(),
});

// Folder Fetch Schema
export const FolderFetchSchema = z.object({
  instanceId: IdSchema,
  instanceType: z.enum(['Radarr', 'Sonarr']),
});

// Form state types for server actions
export type FormState<T = unknown> = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};

// Helper function to create form state
export const createFormState = <T = unknown>(
  success: boolean,
  message?: string,
  errors?: Record<string, string[]>,
  data?: T
): FormState<T> => ({
  success,
  message,
  errors,
  data,
});

// Helper function to handle validation errors
export const handleValidationErrors = (error: z.ZodError): FormState => {
  const fieldErrors = error.flatten().fieldErrors;
  return createFormState(false, 'Validation failed', fieldErrors);
};

// Helper function to handle server errors
export const handleServerError = (
  error: unknown,
  defaultMessage: string
): FormState => {
  const message = error instanceof Error ? error.message : defaultMessage;
  console.error('Server action error:', error);
  return createFormState(false, message);
};
