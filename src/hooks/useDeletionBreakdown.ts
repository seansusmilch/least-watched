import { useState, useEffect } from 'react';
import { MediaItem } from '@/lib/types/media';

export function useDeletionBreakdown() {
  const [breakdownItem, setBreakdownItem] = useState<MediaItem | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const handleOpenBreakdown = (event: CustomEvent) => {
      setBreakdownItem(event.detail.item);
      setShowBreakdown(true);
    };

    window.addEventListener(
      'openDeletionBreakdown',
      handleOpenBreakdown as EventListener
    );

    return () => {
      window.removeEventListener(
        'openDeletionBreakdown',
        handleOpenBreakdown as EventListener
      );
    };
  }, []);

  const handleCloseBreakdown = () => {
    setShowBreakdown(false);
    setBreakdownItem(null);
  };

  return {
    breakdownItem,
    showBreakdown,
    handleCloseBreakdown,
  };
}
