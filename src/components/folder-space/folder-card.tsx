'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Tv, Film, AlertTriangle } from 'lucide-react';
import { formatFileSize } from './utils';
import { EnhancedFolderDetails } from './enhanced-folder-details';
import { DiskSpaceDetails } from './disk-space-details';
import type { FolderSpaceData } from '@/lib/actions/media-processing';

interface FolderCardProps {
  folder: FolderSpaceData;
  onClick: (folderPath: string) => void;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const isEnhanced = folder.enhancedData;
  const hasDiskSpaceData = folder.diskSpaceData?.hasEnhancedData;
  const freeSpacePercent = folder.totalSpaceGB
    ? (folder.freeSpaceGB / folder.totalSpaceGB) * 100
    : 0;

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isEnhanced?.isLowSpace ? 'border-orange-500' : ''
      } ${hasDiskSpaceData ? 'border-blue-200' : ''}`}
      onClick={() => onClick(folder.path)}
    >
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center space-x-2'>
            {folder.type === 'movie' ? (
              <Film className='h-4 w-4 text-blue-500' />
            ) : (
              <Tv className='h-4 w-4 text-green-500' />
            )}
            <HardDrive className='h-4 w-4 text-gray-500' />
            {isEnhanced?.isLowSpace && (
              <AlertTriangle className='h-4 w-4 text-orange-500' />
            )}
          </div>
          <div className='flex space-x-1'>
            {isEnhanced && (
              <Badge variant='secondary' className='text-xs'>
                Enhanced
              </Badge>
            )}
            {hasDiskSpaceData && (
              <Badge variant='outline' className='text-xs'>
                DiskSpace
              </Badge>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <div className='text-sm font-medium truncate' title={folder.label}>
            {folder.label}
          </div>
          <div
            className='text-xs text-muted-foreground truncate'
            title={folder.path}
          >
            {folder.path}
          </div>
          <div className='text-xs text-muted-foreground'>{folder.source}</div>

          {/* Enhanced space visualization for Radarr */}
          {isEnhanced && folder.totalSpaceGB && (
            <div className='space-y-1'>
              <div className='flex justify-between text-xs'>
                <span>Space Usage</span>
                <span>{freeSpacePercent.toFixed(1)}% free</span>
              </div>
              <Progress value={100 - freeSpacePercent} className='h-2' />
            </div>
          )}

          <div className='text-center py-2'>
            <div className='text-lg font-bold text-green-600'>
              {formatFileSize(folder.freeSpaceGB)}
            </div>
            <div className='text-xs text-muted-foreground'>
              Free Space
              {folder.totalSpaceGB && (
                <span> of {formatFileSize(folder.totalSpaceGB)}</span>
              )}
            </div>
          </div>

          {/* Enhanced data for Radarr folders */}
          {isEnhanced && <EnhancedFolderDetails enhancedData={isEnhanced} />}

          {/* Enhanced diskspace data */}
          {hasDiskSpaceData && folder.diskSpaceData && (
            <DiskSpaceDetails diskSpaceData={folder.diskSpaceData} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
