import { ColumnConfig } from '@/lib/types/media';

export const availableColumns: ColumnConfig[] = [
  { id: 'title', label: 'Title', defaultVisible: true },
  { id: 'type', label: 'Type', defaultVisible: true },
  { id: 'year', label: 'Year', defaultVisible: false },
  { id: 'size', label: 'Size', defaultVisible: true },
  { id: 'quality', label: 'Quality', defaultVisible: false },
  { id: 'completion', label: 'Completion', defaultVisible: false },
  { id: 'rating', label: 'Rating', defaultVisible: false },
  { id: 'source', label: 'Source', defaultVisible: true },
  { id: 'folder', label: 'Folder', defaultVisible: false },
  { id: 'dateAdded', label: 'Date Added', defaultVisible: true },
  { id: 'dateAddedEmby', label: 'Emby Date Added', defaultVisible: false },
  { id: 'dateAddedArr', label: 'Arr Date Added', defaultVisible: false },
  { id: 'lastWatched', label: 'Last Watched', defaultVisible: true },
  { id: 'unwatchedDays', label: 'Days Unwatched', defaultVisible: true },
  { id: 'deletionScore', label: 'Deletion Score', defaultVisible: true },
];

const COLUMN_VISIBILITY_KEY = 'least-watched-column-visibility';

export const getDefaultColumnVisibility = (): Record<string, boolean> => {
  return availableColumns.reduce((acc, col) => {
    acc[col.id] = col.defaultVisible;
    return acc;
  }, {} as Record<string, boolean>);
};

export const loadColumnVisibility = (): Record<string, boolean> => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, boolean>;

        // Ensure all columns are present in the saved data
        const defaultVisibility = getDefaultColumnVisibility();
        const mergedVisibility = { ...defaultVisibility };

        // Apply saved preferences, but only for columns that exist
        for (const [key, value] of Object.entries(parsed)) {
          if (key in mergedVisibility) {
            mergedVisibility[key] = value;
          }
        }

        return mergedVisibility;
      }
    }
  } catch (error) {
    console.warn(
      'Failed to load column visibility settings from localStorage:',
      error
    );
  }

  return getDefaultColumnVisibility();
};

export const saveColumnVisibility = (
  visibility: Record<string, boolean>
): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(visibility));
    }
  } catch (error) {
    console.warn(
      'Failed to save column visibility settings to localStorage:',
      error
    );
  }
};
