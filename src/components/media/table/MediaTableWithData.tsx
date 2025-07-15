'use client';

import { MediaTableBase } from './MediaTableBase';
import { MediaItem } from '@/lib/types/media';
import { useMediaTable } from '@/hooks/useMediaTable';

interface MediaTableWithDataProps {
  items: MediaItem[];
}

export function MediaTableWithData({ items }: MediaTableWithDataProps) {
  // Initialize TanStack Table
  const { table } = useMediaTable(items);

  return <MediaTableBase table={table} />;
}
