'use client';

import { useQuery } from '@tanstack/react-query';
import { MediaPageContent } from './MediaPageContent';
import { MediaTableSkeleton } from './table/MediaTableSkeleton';
import {
  getProcessedMediaItems,
  getSelectedFoldersFromDatabase,
} from '@/lib/actions/media-processing';
import { getUniqueFilterOptions } from '@/lib/utils/mediaFilters';
import { getEmbySettings } from '@/lib/actions/settings/emby';

interface MediaPageClientProps {
  fullscreen?: boolean;
}

export function MediaPageClient({ fullscreen = false }: MediaPageClientProps) {
  const { data: processedItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['processed-media-items'],
    queryFn: getProcessedMediaItems,
  });

  const { data: embySettings, isLoading: embyLoading } = useQuery({
    queryKey: ['emby-settings'],
    queryFn: getEmbySettings,
  });

  const { data: selectedFolders, isLoading: foldersLoading } = useQuery({
    queryKey: ['selected-folders'],
    queryFn: getSelectedFoldersFromDatabase,
  });

  const isLoading = itemsLoading || embyLoading || foldersLoading;

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {!fullscreen && <div className='h-32 bg-muted animate-pulse rounded' />}
        <MediaTableSkeleton />
      </div>
    );
  }

  const filterOptions = getUniqueFilterOptions(processedItems);

  const availableFolders = [
    ...(selectedFolders?.radarrFolders.flatMap((i) => i.folders) ?? []),
    ...(selectedFolders?.sonarrFolders.flatMap((i) => i.folders) ?? []),
  ].sort();

  return (
    <MediaPageContent
      items={processedItems}
      availableGenres={filterOptions.genres}
      availableQualities={filterOptions.qualities}
      availableSources={filterOptions.sources}
      availableFolders={availableFolders.length > 0 ? availableFolders : filterOptions.folders}
      embyUrl={embySettings?.url}
      embyApiKey={embySettings?.apiKey}
      fullscreen={fullscreen}
    />
  );
}
