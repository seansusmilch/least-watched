import { MediaItem, SortCriteria, FilterOptions } from '@/lib/types/media';
import { isMediaPathInFolder } from '@/lib/utils';

export const filterMediaItems = (
  items: MediaItem[],
  filters: FilterOptions
): MediaItem[] => {
  return items.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(filters.searchTerm.toLowerCase());
    const matchesType =
      filters.filterType === 'all' || item.type === filters.filterType;
    const matchesSize =
      !filters.minSize ||
      (item.sizeOnDisk || 0) >=
        parseFloat(filters.minSize) * 1024 * 1024 * 1024;
    const matchesFolder =
      !filters.folderFilter ||
      isMediaPathInFolder(item.mediaPath, filters.folderFilter) ||
      isMediaPathInFolder(item.parentFolder, filters.folderFilter);
    return matchesSearch && matchesType && matchesSize && matchesFolder;
  });
};

export const sortMediaItems = (
  items: MediaItem[],
  sortCriteria: SortCriteria
): MediaItem[] => {
  return [...items].sort((a, b) => {
    const aValue = a[sortCriteria.field];
    const bValue = b[sortCriteria.field];
    const modifier = sortCriteria.order === 'asc' ? 1 : -1;

    if (aValue === bValue) return 0;

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * modifier;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return (aValue.getTime() - bValue.getTime()) * modifier;
    }

    return String(aValue || '').localeCompare(String(bValue || '')) * modifier;
  });
};

export const filterAndSortMediaItems = (
  items: MediaItem[],
  filters: FilterOptions,
  sortCriteria: SortCriteria
): MediaItem[] => {
  const filtered = filterMediaItems(items, filters);
  return sortMediaItems(filtered, sortCriteria);
};
