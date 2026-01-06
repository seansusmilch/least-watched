import path from 'path';
import type Emby from 'emby-sdk-stainless';
import type { ProcessedMediaItem } from '@/lib/types/media';
import { normalizeProviderIds } from './arr-matching';
import { sanitizeText } from '@/lib/utils/text-sanitization';

export function createBaseProcessedItem(
  item: Emby.BaseItem
): ProcessedMediaItem {
  const name = item.Name || item.OriginalTitle || 'Unknown';
  const type = item.Type === 'Series' ? 'tv' : 'movie';
  const providerIds = normalizeProviderIds(
    (item as unknown as { ProviderIds?: Record<string, string> }).ProviderIds
  );
  const embyOverview = sanitizeText(
    (item as unknown as { Overview?: unknown }).Overview
  );

  return {
    title: name,
    type,
    tmdbId: providerIds['tmdb'] ? Number(providerIds['tmdb']) : undefined,
    imdbId: providerIds['imdb'] || providerIds['imdbid'],
    tvdbId: providerIds['tvdb'] ? Number(providerIds['tvdb']) : undefined,
    year: item.ProductionYear ?? undefined,
    mediaPath: item.Path || '',
    parentFolder: item.Path ? path.dirname(item.Path) : '',
    sizeOnDisk: 0,
    dateAddedEmby: item.DateCreated ? new Date(item.DateCreated) : undefined,
    overview: embyOverview,
    source: 'Emby',
    embyId: String(item.Id),
  };
}
