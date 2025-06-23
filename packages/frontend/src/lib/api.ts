import type { AppConfig } from '../types/config';

// Base API configuration
const API_BASE_URL = ''; // Empty since we're using relative URLs

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API fetch wrapper with error handling
async function apiRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new ApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      response.statusText
    );
  }

  return response.json();
}

// Types for API responses
export interface MediaItem {
  id: number;
  title: string;
  media_type: string;
  size_gb: number;
  date_created: string;
  root_folder: string;
}

export interface MediaStats {
  total_size: number;
  last_updated: string | null;
  counts: {
    movie?: number;
    show?: number;
    [key: string]: number | undefined;
  };
  total_count: number;
}

export interface ConfigResponse {
  config: AppConfig;
}

export interface MediaResponse {
  media_items: MediaItem[];
}

// API functions
export const api = {
  // Fetch media statistics
  getStats: (): Promise<MediaStats> => apiRequest<MediaStats>('/api/stats'),

  // Fetch all media items
  getMediaItems: (): Promise<MediaResponse> =>
    apiRequest<MediaResponse>('/api/media'),

  // Fetch filtered media items (if backend supports filtering)
  getMediaItemsByType: (mediaType: string): Promise<MediaResponse> =>
    apiRequest<MediaResponse>(
      `/api/media?type=${encodeURIComponent(mediaType)}`
    ),

  // Fetch application configuration
  getConfig: (): Promise<ConfigResponse> =>
    apiRequest<ConfigResponse>('/api/config'),

  // Update application configuration
  updateConfig: async (
    config: Partial<AppConfig>
  ): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });

    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        response.statusText
      );
    }

    return response.json();
  },
};

// Query keys factory for consistent cache management
export const queryKeys = {
  // Media queries
  media: {
    all: ['media'] as const,
    items: () => [...queryKeys.media.all, 'items'] as const,
    itemsByType: (type: string) =>
      [...queryKeys.media.all, 'items', type] as const,
  },
  // Stats queries
  stats: {
    all: ['stats'] as const,
    summary: () => [...queryKeys.stats.all, 'summary'] as const,
  },
  // Config queries
  config: {
    all: ['config'] as const,
  },
} as const;
