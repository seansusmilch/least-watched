'use client';

import { formatFileSize } from '@/lib/utils/formatters';
import type { FolderSpaceData } from '@/lib/types/media-processing';

interface FolderSummaryStatsProps {
  folderSpaceData: FolderSpaceData[];
}

export function FolderSummaryStats({
  folderSpaceData,
}: FolderSummaryStatsProps) {
  const totalFolders = folderSpaceData.length;
  const totalFreeSpace = folderSpaceData.reduce(
    (sum, folder) => sum + folder.freeSpaceGB,
    0
  );

  return (
    <div className='grid grid-cols-2 gap-4 mb-6'>
      <div className='text-center'>
        <div className='text-2xl font-bold'>{totalFolders}</div>
        <div className='text-sm text-muted-foreground'>Total Folders</div>
      </div>
      <div className='text-center'>
        <div className='text-2xl font-bold'>
          {formatFileSize(totalFreeSpace)}
        </div>
        <div className='text-sm text-muted-foreground'>Total Free Space</div>
      </div>
    </div>
  );
}
