'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderOpen, Settings, Tv, Film, Folder } from 'lucide-react';
import type { FolderWithSpaceEnhanced } from '@/lib/types/media-processing';
import { formatBytes } from '@/lib/utils/formatters';

interface FolderSpaceWidgetProps {
  initialData?: FolderWithSpaceEnhanced[];
}

export function FolderSpaceWidget({
  initialData = [],
}: FolderSpaceWidgetProps) {
  // Group folders by drive root for better organization
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

  // Filter to show only selected folders
  const selectedFolders = initialData.filter((folder) => folder.isSelected);

  // Group selected folders by drive
  const groupedFolders = groupFoldersByDrive(selectedFolders);

  if (selectedFolders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <FolderOpen className='h-5 w-5' />
            <span>Selected Folders Space</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <p className='text-muted-foreground'>
              No folders selected. This could be because:
            </p>
            <div className='text-sm text-muted-foreground space-y-2'>
              <p>• No Sonarr/Radarr instances are configured</p>
              <p>• No folders are selected in your instance settings</p>
              <p>• All configured instances are disabled</p>
              <p>• API connection issues with your instances</p>
            </div>
            <div className='flex items-center space-x-2 text-sm'>
              <Settings className='h-4 w-4' />
              <span>
                Configure instances and select folders in Settings → Media
                Services
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2'>
          <FolderOpen className='h-5 w-5' />
          <span>Selected Folders Space</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Folder list grouped by drive */}
        <div>
          {Object.entries(groupedFolders).map(([driveRoot, folders]) => (
            <div key={driveRoot} className='space-y-3'>
              {/* Folders in this drive */}
              <div className='flex flex-row gap-4 overflow-x-auto flex-nowrap pb-2'>
                {folders.map((folder, index) => {
                  const folderId = `${folder.instanceType}-${folder.instanceName}-${folder.path}-${index}`;
                  return (
                    <Card
                      key={folderId}
                      className='flex-shrink-0 w-80 relative'
                    >
                      <CardHeader className='flex items-center justify-between px-4'>
                        <CardTitle className='flex items-center space-x-2'>
                          <Folder className='h-4 w-4 text-gray-500' />
                          <span className='font-medium text-sm truncate'>
                            {folder.path}
                          </span>
                        </CardTitle>
                        <div className='flex items-center space-x-2'>
                          {folder.instanceType === 'sonarr' ? (
                            <Badge variant='outline' className='text-xs'>
                              <Tv className='h-3 w-3 mr-1 text-green-500' />
                              {folder.instanceName}
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='text-xs'>
                              <Film className='h-3 w-3 mr-1 text-blue-500' />
                              {folder.instanceName}
                            </Badge>
                          )}
                          {!folder.enabled && (
                            <Badge variant='secondary' className='text-xs'>
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className='px-4'>
                        {/* Space usage progress bar */}
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                              {folder.usedSpacePercent.toFixed(1)}% used
                            </span>
                            <span className='text-muted-foreground'>
                              {formatBytes(folder.usedSpace)} /{' '}
                              {formatBytes(folder.totalSpace)}
                            </span>
                          </div>
                          <Progress
                            value={folder.usedSpacePercent}
                            className='h-2'
                          />
                        </div>

                        {/* Space details */}
                        <div className='grid grid-cols-3 gap-4 text-sm'>
                          <div>
                            <p className='text-muted-foreground'>Used</p>
                            <p className='font-medium'>
                              {formatBytes(folder.usedSpace)}
                            </p>
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Free</p>
                            <p className='font-medium'>
                              {formatBytes(folder.freeSpace)}
                            </p>
                          </div>
                          <div>
                            <p className='text-muted-foreground'>Total</p>
                            <p className='font-medium'>
                              {formatBytes(folder.totalSpace)}
                            </p>
                          </div>
                        </div>

                        {/* Additional metadata */}
                        <div className='flex items-center space-x-4 text-xs text-muted-foreground'>
                          {folder.driveFormat && (
                            <span>Format: {folder.driveFormat}</span>
                          )}
                          {folder.isRootFolder && <span>Root Folder</span>}
                          {folder.isDiskSpaceFolder && <span>Disk Space</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
