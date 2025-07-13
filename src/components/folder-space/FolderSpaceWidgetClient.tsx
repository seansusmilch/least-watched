'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderOpen,
  RefreshCw,
  Settings,
  Tv,
  Film,
  Folder,
  Filter,
} from 'lucide-react';
import { getAllFoldersWithSpace } from '@/lib/actions/media-processing';
import type { FolderWithSpaceEnhanced } from '@/lib/types/media-processing';

interface FolderSpaceWidgetClientProps {
  initialData: FolderWithSpaceEnhanced[];
  onFolderClick?: (folderName: string) => void;
  onRefresh?: () => void;
}

export function FolderSpaceWidgetClient({
  initialData,
  onFolderClick,
  onRefresh,
}: FolderSpaceWidgetClientProps) {
  const [allFoldersWithSpace, setAllFoldersWithSpace] =
    useState<FolderWithSpaceEnhanced[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);

  // Helper function to format bytes to human readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

  // Fetch all folders with disk space from the new API
  const fetchAllFoldersWithSpace = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching all folders with disk space...');

      const data = await getAllFoldersWithSpace();
      console.log('📊 Received all folders with disk space:', data);

      setAllFoldersWithSpace(data);
    } catch (error) {
      console.error('❌ Error fetching all folders with disk space:', error);
      setError('Failed to fetch all folder disk space information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAllFoldersWithSpace();
    onRefresh?.();
  };

  const handleFolderClick = (folderPath: string) => {
    onFolderClick?.(folderPath);
  };

  // Filter to show only selected folders
  const selectedFolders = allFoldersWithSpace.filter(
    (folder) => folder.isSelected
  );

  // Group selected folders by drive
  const groupedFolders = groupFoldersByDrive(selectedFolders);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <FolderOpen className='h-5 w-5' />
            <span>Selected Folders Space</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-row gap-4'>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card
                key={idx}
                className='cursor-pointer flex-shrink-0 w-80 hover:bg-muted relative'
              >
                <CardHeader className='flex items-center justify-between px-4'>
                  {/* Header skeleton: icon and title */}
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-1/2' />
                </CardHeader>
                <CardContent className='px-4'>
                  {/* Progress bar skeleton */}
                  <Skeleton className='h-2 w-full mb-4' />
                  {/* Grid of space details skeleton */}
                  <div className='grid grid-cols-3 gap-4 mb-4'>
                    <Skeleton className='h-6 w-full' />
                    <Skeleton className='h-6 w-full' />
                    <Skeleton className='h-6 w-full' />
                  </div>
                  {/* Metadata skeleton */}
                  <div className='flex items-center space-x-4'>
                    <Skeleton className='h-3 w-1/3' />
                    <Skeleton className='h-3 w-1/4' />
                    <Skeleton className='h-3 w-1/5' />
                  </div>
                  <Badge variant='outline' className='text-xs'></Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <FolderOpen className='h-5 w-5' />
            <span>Selected Folders Space</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <p className='text-red-500'>{error}</p>
            <Button variant='outline' size='sm' onClick={handleRefresh}>
              <RefreshCw className='h-4 w-4 mr-2' />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <div className='flex items-center justify-between'>
              <p className='text-muted-foreground'>
                No folders selected. This could be because:
              </p>
              <Button variant='outline' size='sm' onClick={handleRefresh}>
                <RefreshCw className='h-4 w-4 mr-2' />
                Refresh
              </Button>
            </div>
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
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center space-x-2'>
            <FolderOpen className='h-5 w-5' />
            <span>Selected Folders Space</span>
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Folder list grouped by drive */}
        <div>
          {Object.entries(groupedFolders).map(([driveRoot, folders]) => (
            <div key={driveRoot} className='space-y-3'>
              {/* Folders in this drive */}
              <div className='flex flex-row gap-4'>
                {folders.map((folder, index) => {
                  const folderId = `${folder.instanceType}-${folder.instanceName}-${folder.path}-${index}`;
                  return (
                    <Card
                      key={folderId}
                      className='cursor-pointer flex-shrink-0 w-80 hover:bg-muted relative'
                      onClick={() => handleFolderClick(folder.path)}
                      onMouseEnter={() => setHoveredFolderId(folderId)}
                      onMouseLeave={() => setHoveredFolderId(null)}
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
                        <div className=''>
                          {/* Hover badge */}
                          {hoveredFolderId === folderId && (
                            <div className='absolute bottom-2 right-2 z-10'>
                              <Badge
                                variant='secondary'
                                className='text-xs flex items-center space-x-1'
                              >
                                <Filter className='h-3 w-3' />
                                <span>Click to add to filters</span>
                              </Badge>
                            </div>
                          )}

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
                            {folder.isDiskSpaceFolder && (
                              <span>Disk Space</span>
                            )}
                          </div>
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
