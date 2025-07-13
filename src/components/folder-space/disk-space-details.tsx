'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';
import { formatFileSize } from './utils';
import type { FolderSpaceData } from '@/lib/types/media-processing';

interface DiskSpaceDetailsProps {
  diskSpaceData: NonNullable<FolderSpaceData['diskSpaceData']>;
}

export function DiskSpaceDetails({ diskSpaceData }: DiskSpaceDetailsProps) {
  return (
    <div className='space-y-2 pt-2 border-t'>
      <div className='text-xs font-medium text-blue-600'>
        Disk Space Details
      </div>

      {diskSpaceData.percentUsed !== undefined && (
        <div className='space-y-1'>
          <div className='flex justify-between text-xs'>
            <span>Usage</span>
            <span>{diskSpaceData.percentUsed.toFixed(1)}%</span>
          </div>
          <Progress value={diskSpaceData.percentUsed} className='h-2' />
        </div>
      )}

      {diskSpaceData.driveFormat && (
        <div className='flex items-center justify-between text-xs'>
          <span>Format</span>
          <Badge variant='outline' className='text-xs'>
            {diskSpaceData.driveFormat}
          </Badge>
        </div>
      )}

      {diskSpaceData.isSystemDrive && (
        <div className='flex items-center space-x-1 text-xs text-amber-600'>
          <AlertTriangle className='h-3 w-3' />
          <span>System Drive</span>
        </div>
      )}

      {diskSpaceData.unmappedFolders &&
        diskSpaceData.unmappedFolders.length > 0 && (
          <div className='space-y-1'>
            <div className='text-xs font-medium'>
              Unmapped Folders ({diskSpaceData.unmappedFolders.length})
            </div>
            <div className='max-h-16 overflow-y-auto space-y-1'>
              {diskSpaceData.unmappedFolders
                .slice(0, 3)
                .map((unmapped, idx) => (
                  <div
                    key={idx}
                    className='text-xs text-muted-foreground truncate'
                  >
                    {unmapped.name}:{' '}
                    {formatFileSize(unmapped.size / (1024 * 1024 * 1024))}
                  </div>
                ))}
              {diskSpaceData.unmappedFolders.length > 3 && (
                <div className='text-xs text-muted-foreground'>
                  +{diskSpaceData.unmappedFolders.length - 3} more...
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
