'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, HardDrive, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { fetchFolders, type FolderInfo } from '@/lib/actions/settings';
import { toast } from 'sonner';

interface FolderSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string;
  instanceName: string;
  instanceType: 'sonarr' | 'radarr';
  currentSelectedFolders: string[];
  onSave: (selectedFolders: string[]) => void;
}

export function FolderSelectionDialog({
  open,
  onOpenChange,
  instanceId,
  instanceName,
  instanceType,
  currentSelectedFolders,
  onSave,
}: FolderSelectionDialogProps) {
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>(
    currentSelectedFolders
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      const getFolders = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await fetchFolders(
            instanceId,
            instanceType.charAt(0).toUpperCase() +
              (instanceType.slice(1) as 'Radarr' | 'Sonarr')
          );
          if (result.success) {
            setFolders(result.data ?? []);
          } else {
            setError(result.error ?? 'Failed to fetch folders.');
          }
        } catch {
          setError('An unexpected error occurred.');
        } finally {
          setIsLoading(false);
        }
      };
      getFolders();
    }
  }, [open, instanceId, instanceType]);

  useEffect(() => {
    setSelectedFolders(currentSelectedFolders);
  }, [currentSelectedFolders]);

  const handleToggleFolder = (folderPath: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderPath)
        ? prev.filter((f) => f !== folderPath)
        : [...prev, folderPath]
    );
  };

  const handleSave = () => {
    startTransition(() => {
      onSave(selectedFolders);
      toast.success(`Folder selection for ${instanceName} has been updated.`);
      onOpenChange(false);
    });
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-5xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <HardDrive className='h-6 w-6' />
            Select Folders for {instanceName}
          </DialogTitle>
          <DialogDescription>
            Choose the folders you want to be managed by the application. These
            are the root folders configured in your {instanceType} instance.
          </DialogDescription>
        </DialogHeader>

        <div className='my-4'>
          <Separator />
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center h-96'>
            <div className='flex flex-col items-center gap-2'>
              <RefreshCw className='h-8 w-8 animate-spin' />
              <p className='text-muted-foreground'>
                Fetching folders from {instanceType}...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center h-96'>
            <Card className='w-full border-destructive bg-destructive/10'>
              <CardContent className='p-4 text-center'>
                <p className='text-destructive font-semibold'>Error</p>
                <p className='text-sm text-destructive/80'>{error}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className='flex justify-between items-center mb-4 px-1'>
              <h3 className='text-lg font-medium'>Available Folders</h3>
              <Badge variant='secondary'>
                {selectedFolders.length} / {folders.length} selected
              </Badge>
            </div>
            <ScrollArea className='h-[50vh] w-full rounded-md border'>
              <div className='p-4 grid grid-cols-1 lg:grid-cols-2 gap-3'>
                {folders.map((folder) => (
                  <div
                    key={folder.path}
                    onClick={() => handleToggleFolder(folder.path)}
                    className={`
                      flex items-start space-x-3 rounded-lg border p-3
                      transition-all cursor-pointer
                      hover:bg-accent hover:text-accent-foreground
                      ${
                        selectedFolders.includes(folder.path)
                          ? 'bg-accent/60 border-primary ring-2 ring-primary'
                          : 'bg-transparent'
                      }
                    `}
                  >
                    <Checkbox
                      checked={selectedFolders.includes(folder.path)}
                      onCheckedChange={() => handleToggleFolder(folder.path)}
                      aria-label={`Select folder ${folder.path}`}
                      className='mt-1'
                    />
                    <div className='flex-grow'>
                      <div className='flex items-center justify-between'>
                        <span className='font-semibold text-base flex items-center gap-2'>
                          <Folder className='h-5 w-5 text-primary' />
                          {folder.label}
                        </span>
                      </div>
                      <p
                        className='text-xs font-mono truncate text-muted-foreground'
                        title={folder.path}
                      >
                        {folder.path}
                      </p>
                      {folder.totalSpace > 0 && (
                        <div className='mt-2 text-xs space-y-1'>
                          <div className='flex justify-between'>
                            <span>
                              Free:{' '}
                              <span className='font-medium'>
                                {formatBytes(folder.freeSpace)}
                              </span>
                            </span>
                            <span>
                              Total:{' '}
                              <span className='font-medium'>
                                {formatBytes(folder.totalSpace)}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter className='mt-6'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Selection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
