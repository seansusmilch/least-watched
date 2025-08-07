import { MediaSummaryCards } from './MediaSummaryCards';
import { getProcessedMediaItems } from '@/lib/actions/media-processing';

export async function MediaSummaryCardsServer() {
  // Fetch processed data
  const processedItems = await getProcessedMediaItems();

  return (
    <MediaSummaryCards
      filteredItems={processedItems}
      totalItems={processedItems.length}
    />
  );
}
