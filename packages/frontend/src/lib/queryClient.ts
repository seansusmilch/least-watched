import { QueryClient } from '@tanstack/react-query';

// Create QueryClient with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes before considered stale
      staleTime: 1000 * 60 * 5,
      // Cache data for 30 minutes before garbage collection
      gcTime: 1000 * 60 * 30,
      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      // Don't refetch on window focus in development
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});
