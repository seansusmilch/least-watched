import { MediaSummaryCards } from './MediaSummaryCards';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';
import { MediaItem } from '@/lib/types/media';
import { getMediaItems } from '@/lib/actions/media-processing';

export async function MediaSummaryCardsServer() {
  const items = await getMediaItems();

  const processedItems: MediaItem[] = items.map((item) => ({
    ...item,
    sizeOnDisk: item.sizeOnDisk ? Number(item.sizeOnDisk) : 0,
    unwatchedDays: calculateUnwatchedDays(item.lastWatched, item.dateAdded),
    genres: item.genres ? JSON.parse(item.genres) : undefined,
  }));

  return (
    <MediaSummaryCards
      filteredItems={processedItems}
      totalItems={processedItems.length}
    />
  );
}
