'use client';

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Settings, Tv, Film } from 'lucide-react';
import type { FolderWithSpaceEnhanced } from '@/lib/types/media-processing';
import { formatBytes } from '@/lib/utils/formatters';

interface FolderSpaceWidgetProps {
  initialData?: FolderWithSpaceEnhanced[];
}

export function FolderSpaceWidget({
  initialData = [],
}: FolderSpaceWidgetProps) {
  const groupFoldersByDrive = (folders: FolderWithSpaceEnhanced[]) => {
    const groups: { [key: string]: FolderWithSpaceEnhanced[] } = {};

    folders.forEach((folder) => {
      const driveRoot = folder.driveRoot || 'Unknown';
      if (!groups[driveRoot]) {
        groups[driveRoot] = [];
      }
      groups[driveRoot].push(folder);
    });

    return groups;
  };

  const selectedFolders = initialData.filter((folder) => folder.isSelected);
  const groupedFolders = groupFoldersByDrive(selectedFolders);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    console.log('🧩 FolderSpaceWidget received:', {
      total: initialData.length,
      selected: selectedFolders.length,
      sample: initialData.slice(0, 2),
    });
  }, [initialData, selectedFolders.length]);

  if (selectedFolders.length === 0) {
    return (
      <div className='py-3 border-b border-border/50'>
        <p className='text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3'>
          Disk Space
        </p>
        <p className='text-sm text-muted-foreground'>
          No folders selected.{' '}
          <span className='inline-flex items-center gap-1'>
            <Settings className='size-3' />
            Configure in Settings → Media Services.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className='py-3 border-b border-border/50'>
      <p className='text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3'>
        Disk Space
      </p>

      <div className='flex flex-col divide-y divide-border/40'>
        {Object.entries(groupedFolders).map(([, folders]) =>
          folders.map((folder, index) => {
            const folderId = `${folder.instanceType}-${folder.instanceName}-${folder.path}-${index}`;
            const freePercent = 100 - folder.usedSpacePercent;

            return (
              <div key={folderId} className='py-2 flex items-center gap-3 min-w-0'>
                <div className='flex items-center gap-1.5 min-w-0 shrink'>
                  {folder.instanceType === 'sonarr' ? (
                    <Tv className='size-3 text-muted-foreground shrink-0' />
                  ) : (
                    <Film className='size-3 text-muted-foreground shrink-0' />
                  )}
                  <span
                    className='text-xs font-mono text-muted-foreground truncate'
                    title={folder.path}
                  >
                    {folder.path}
                  </span>
                  <Badge variant='outline' className='text-[10px] px-1.5 h-4 shrink-0'>
                    {folder.instanceName}
                  </Badge>
                  {!folder.enabled && (
                    <Badge variant='secondary' className='text-[10px] px-1.5 h-4 shrink-0'>
                      Disabled
                    </Badge>
                  )}
                </div>

                <div className='flex items-center gap-4 ml-auto shrink-0 text-xs text-muted-foreground'>
                  <span>
                    <span className='font-mono font-semibold text-foreground'>
                      {formatBytes(folder.freeSpace)}
                    </span>{' '}
                    free
                  </span>
                  <span>{freePercent.toFixed(0)}%</span>
                  <span className='hidden sm:inline'>{formatBytes(folder.totalSpace)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
