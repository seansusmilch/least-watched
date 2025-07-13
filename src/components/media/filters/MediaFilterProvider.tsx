'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import { FilterOptions, SortCriteria } from '@/lib/types/media';

interface MediaFilterContextType {
  filters: FilterOptions;
  sortCriteria: SortCriteria;
  updateFilter: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  applyQuickFilter: (filters: Partial<FilterOptions>) => void;
  handleSort: (field: keyof import('@/lib/types/media').MediaItem) => void;
}

export const MediaFilterContext = createContext<
  MediaFilterContextType | undefined
>(undefined);

export function MediaFilterProvider({ children }: { children: ReactNode }) {
  const mediaFilters = useMediaFilters();

  return (
    <MediaFilterContext.Provider value={mediaFilters}>
      {children}
    </MediaFilterContext.Provider>
  );
}

export function useMediaFilterContext() {
  const context = useContext(MediaFilterContext);
  if (context === undefined) {
    throw new Error(
      'useMediaFilterContext must be used within a MediaFilterProvider'
    );
  }
  return context;
}
