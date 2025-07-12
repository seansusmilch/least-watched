import { useState, useEffect } from 'react';
import { SortCriteria, FilterOptions, MediaItem } from '@/lib/types/media';
import { getDeletionScoreSettings } from '@/lib/actions/settings';

export const useMediaFilters = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    filterType: 'all',
    minSize: '',
    folderFilter: '',
  });

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

  const updateFilter = (key: keyof FilterOptions, value: string) => {
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

  return {
    filters,
    sortCriteria,
    updateFilter,
    handleSort,
  };
};
