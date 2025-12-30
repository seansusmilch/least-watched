'use client';

import { MediaFilterProvider } from './filters/MediaFilterProvider';
import { MediaTableWithFilters } from './table/MediaTableWithFilters';
import { MediaItem } from '@/lib/types/media';

interface MediaPageContentProps {
  items: MediaItem[];
  availableGenres: string[];
  availableQualities: string[];
  availableSources: string[];
  availableFolders: string[];
}

export function MediaPageContent({
  items,
  availableGenres,
  availableQualities,
  availableSources,
  availableFolders,
}: MediaPageContentProps) {
  return (
    <MediaFilterProvider>
      <div className='space-y-6'>
        {/* Media Table with Filtering and Filters Popover */}
        <MediaTableWithFilters
          items={items}
          availableGenres={availableGenres}
          availableQualities={availableQualities}
          availableSources={availableSources}
          availableFolders={availableFolders}
          totalItems={items.length}
        />
      </div>
    </MediaFilterProvider>
  );
}
