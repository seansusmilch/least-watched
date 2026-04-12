'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Tv, Film } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatters';
import { DiskSpaceDetails } from './disk-space-details';
import type { FolderSpaceData } from '@/lib/types/media-processing';
import { cn } from '@/lib/utils';

interface FolderCardProps {
  folder: FolderSpaceData;
  onClick: (folderPath: string) => void;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const hasDiskSpaceData = folder.diskSpaceData?.hasEnhancedData;
  const freeSpacePercent = folder.totalSpaceGB
    ? (folder.freeSpaceGB / folder.totalSpaceGB) * 100
    : 0;
  const usedPercent = 100 - freeSpacePercent;
  const isMovie = folder.type === 'movie';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card p-4 cursor-pointer',
        'transition-all hover:shadow-md hover:border-border/80',
        'flex flex-col gap-3 min-w-0'
      )}
      onClick={() => onClick(folder.path)}
    >
      {/* Type accent bar */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-0.5',
          isMovie ? 'bg-primary' : 'bg-chart-3'
        )}
      />

      {/* Header */}
      <div className='flex items-center justify-between gap-2 pl-1'>
        <div className='flex items-center gap-2 min-w-0'>
          {isMovie ? (
            <Film className='size-3.5 text-primary shrink-0' />
          ) : (
            <Tv className='size-3.5 text-chart-3 shrink-0' />
          )}
          <span
            className='text-sm font-medium truncate'
            title={folder.label}
          >
            {folder.label}
          </span>
        </div>
        <div className='flex items-center gap-1 shrink-0'>
          {hasDiskSpaceData && (
            <Badge variant='outline' className='text-[10px] px-1.5 h-5'>
              Enhanced
            </Badge>
          )}
          <HardDrive className='size-3.5 text-muted-foreground' />
        </div>
      </div>

      {/* Path + source */}
      <div className='pl-1 space-y-0.5'>
        <p
          className='text-[11px] text-muted-foreground truncate font-mono'
          title={folder.path}
        >
          {folder.path}
        </p>
        <p className='text-[11px] text-muted-foreground'>{folder.source}</p>
      </div>

      {/* Space visualization */}
      {folder.totalSpaceGB ? (
        <div className='pl-1 space-y-1.5'>
          <div className='flex justify-between text-[11px] text-muted-foreground'>
            <span className='font-medium'>
              {freeSpacePercent.toFixed(1)}% free
            </span>
            <span>{formatFileSize(folder.totalSpaceGB)} total</span>
          </div>
          <Progress value={usedPercent} className='h-1.5' />
          <p className='text-base font-bold font-mono text-foreground leading-none'>
            {formatFileSize(folder.freeSpaceGB)}
            <span className='text-xs font-normal text-muted-foreground ml-1'>
              free
            </span>
          </p>
        </div>
      ) : (
        <div className='pl-1'>
          <p className='text-base font-bold font-mono text-foreground leading-none'>
            {formatFileSize(folder.freeSpaceGB)}
            <span className='text-xs font-normal text-muted-foreground ml-1'>
              free
            </span>
          </p>
        </div>
      )}

      {/* Enhanced diskspace data */}
      {hasDiskSpaceData && folder.diskSpaceData && (
        <DiskSpaceDetails diskSpaceData={folder.diskSpaceData} />
      )}
    </div>
  );
}
