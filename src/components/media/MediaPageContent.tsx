'use client';

import { MediaFilterProvider } from './filters/MediaFilterProvider';
import { MediaTableWithFilters } from './table/MediaTableWithFilters';
import { MediaItem } from '@/lib/types/media';
import { getContainerClasses } from '@/lib/utils/tableStyles';

interface MediaPageContentProps {
  items: MediaItem[];
  availableGenres: string[];
  availableQualities: string[];
  availableSources: string[];
  availableFolders: string[];
  embyUrl?: string | null;
  embyApiKey?: string | null;
  fullscreen?: boolean;
}

export function MediaPageContent({
  items,
  availableGenres,
  availableQualities,
  availableSources,
  availableFolders,
  embyUrl,
  embyApiKey,
  fullscreen = false,
}: MediaPageContentProps) {
  return (
    <MediaFilterProvider>
      <div className={getContainerClasses(fullscreen)}>
        <MediaTableWithFilters
          items={items}
          availableGenres={availableGenres}
          availableQualities={availableQualities}
          availableSources={availableSources}
          availableFolders={availableFolders}
          totalItems={items.length}
          embyUrl={embyUrl}
          embyApiKey={embyApiKey}
          fullscreen={fullscreen}
        />
      </div>
    </MediaFilterProvider>
  );
}
