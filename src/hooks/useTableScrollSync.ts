import { useEffect, RefObject } from 'react';
import { SCROLL_SYNC_THROTTLE_MS } from '@/lib/constants/table';

export function useTableScrollSync(
  containerRef: RefObject<HTMLDivElement | null>,
  headerRef: RefObject<HTMLDivElement | null>
) {
  useEffect(() => {
    const container = containerRef.current;
    const header = headerRef.current;

    if (!container || !header) return;

    let lastScrollTime = 0;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      const now = Date.now();
      if (now - lastScrollTime < SCROLL_SYNC_THROTTLE_MS) return;

      lastScrollTime = now;

      if (target.scrollLeft !== source.scrollLeft) {
        target.scrollLeft = source.scrollLeft;
      }
    };

    const handleContainerScroll = () => syncScroll(container, header);
    const handleHeaderScroll = () => syncScroll(header, container);

    container.addEventListener('scroll', handleContainerScroll, {
      passive: true,
    });
    header.addEventListener('scroll', handleHeaderScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener('scroll', handleContainerScroll);
      header.removeEventListener('scroll', handleHeaderScroll);
    };
  }, [containerRef, headerRef]);
}
