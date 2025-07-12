import { useState, useEffect } from 'react';
import { SortCriteria, FilterOptions, MediaItem } from '@/lib/types/media';
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import { createDefaultFilters } from '@/lib/utils/mediaFilters';

export const useMediaFilters = () => {
  const [filters, setFilters] = useState<FilterOptions>(createDefaultFilters());

  const [sortCriteria, setSortCriteria] = useState<SortCriteria>({
    field: 'unwatchedDays',
    order: 'desc',
  });

  // Set default sort based on deletion score settings
  useEffect(() => {
    async function setDefaultSort() {
      try {
        const deletionSettings = await getDeletionScoreSettings();
        if (deletionSettings?.enabled) {
          setSortCriteria({ field: 'deletionScore', order: 'desc' });
        } else {
          setSortCriteria({ field: 'unwatchedDays', order: 'desc' });
        }
      } catch {
        setSortCriteria({ field: 'unwatchedDays', order: 'desc' });
      }
    }
    setDefaultSort();
  }, []);

  const updateFilter = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const updateLegacyFilter = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSort = (field: keyof MediaItem) => {
    setSortCriteria((prev) => {
      if (prev.field === field) {
        // Toggle order if same field
        return { field, order: prev.order === 'asc' ? 'desc' : 'asc' };
      } else {
        // Default to desc for new field
        return { field, order: 'desc' };
      }
    });
  };

  const resetFilters = () => {
    setFilters(createDefaultFilters());
  };

  const applyQuickFilter = (quickFilterOptions: Partial<FilterOptions>) => {
    setFilters((prev) => ({
      ...prev,
      ...quickFilterOptions,
    }));
  };

  return {
    filters,
    sortCriteria,
    updateFilter,
    updateLegacyFilter, // For backward compatibility
    handleSort,
    resetFilters,
    applyQuickFilter,
  };
};
