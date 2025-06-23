import { useQuery } from '@tanstack/react-query';
import {
  api,
  queryKeys,
  MediaItem,
  MediaStats,
  MediaResponse,
} from '../lib/api';

// Hook to fetch media statistics
export const useMediaStats = () => {
  return useQuery({
    queryKey: queryKeys.stats.summary(),
    queryFn: api.getStats,
    staleTime: 1000 * 60 * 2, // Stats are fresh for 2 minutes
    gcTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};

// Hook to fetch all media items
export const useMediaItems = () => {
  return useQuery({
    queryKey: queryKeys.media.items(),
    queryFn: api.getMediaItems,
    select: (data: MediaResponse) => data.media_items, // Extract just the items array
    staleTime: 1000 * 60 * 5, // Media data is fresh for 5 minutes
  });
};

// Hook to fetch media items filtered by type (client-side filtering)
export const useFilteredMediaItems = (filter: string = 'all') => {
  return useQuery({
    queryKey: queryKeys.media.items(),
    queryFn: api.getMediaItems,
    select: (data: MediaResponse) => {
      const items = data.media_items;
      if (filter === 'all') {
        return items;
      }
      return items.filter((item: MediaItem) => item.media_type === filter);
    },
    staleTime: 1000 * 60 * 5,
  });
};

// Hook for combined stats and media data (parallel queries)
export const useMediaDashboard = () => {
  const statsQuery = useMediaStats();
  const itemsQuery = useMediaItems();

  return {
    stats: statsQuery,
    items: itemsQuery,
    isLoading: statsQuery.isPending || itemsQuery.isPending,
    isError: statsQuery.isError || itemsQuery.isError,
    error: statsQuery.error || itemsQuery.error,
  };
};

// Hook for media items with enhanced filtering and sorting
export const useEnhancedMediaItems = (options?: {
  filter?: string;
  sortBy?: 'title' | 'date_created' | 'size_gb';
  sortOrder?: 'asc' | 'desc';
}) => {
  const {
    filter = 'all',
    sortBy = 'date_created',
    sortOrder = 'desc',
  } = options || {};

  return useQuery({
    queryKey: [...queryKeys.media.items(), { filter, sortBy, sortOrder }],
    queryFn: api.getMediaItems,
    select: (data: MediaResponse) => {
      let items = data.media_items;

      // Apply filter
      if (filter !== 'all') {
        items = items.filter((item: MediaItem) => item.media_type === filter);
      }

      // Apply sorting
      return items.sort((a: MediaItem, b: MediaItem) => {
        let comparison = 0;

        switch (sortBy) {
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'date_created':
            comparison =
              new Date(a.date_created).getTime() -
              new Date(b.date_created).getTime();
            break;
          case 'size_gb':
            comparison = a.size_gb - b.size_gb;
            break;
          default:
            comparison = 0;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });
    },
    staleTime: 1000 * 60 * 5,
  });
};
