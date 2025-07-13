import { MediaSummaryCards } from './MediaSummaryCards';
import { getCachedMediaItemsWithScores } from '@/lib/cache/data-cache';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';
import { MediaItem } from '@/lib/types/media';

export async function MediaSummaryCardsServer() {
  const items = await getCachedMediaItemsWithScores();

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
