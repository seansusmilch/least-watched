import { useState, useEffect } from 'react';
import { MediaItem } from '@/lib/types/media';
import { getMediaItemsWithScores } from '@/lib/actions/media-processing';
import { calculateUnwatchedDays } from '@/lib/utils/formatters';

export const useMediaItems = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMediaItems = async () => {
    setLoading(true);
    try {
      const items = await getMediaItemsWithScores();
      const processedItems = items.map((item) => ({
        ...item,
        sizeOnDisk: item.sizeOnDisk ? Number(item.sizeOnDisk) : 0,
        unwatchedDays: calculateUnwatchedDays(item.lastWatched, item.dateAdded),
        genres: item.genres ? JSON.parse(item.genres) : undefined,
      }));
      setMediaItems(processedItems);
    } catch (error) {
      console.error('Error loading media items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMediaItems();
  }, []);

  return {
    mediaItems,
    loading,
    refresh: loadMediaItems,
  };
};
