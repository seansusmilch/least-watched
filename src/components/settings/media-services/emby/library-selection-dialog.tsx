'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Folder, RefreshCw } from 'lucide-react';
import { fetchEmbyLibraries } from '@/lib/actions/settings/emby';

type EmbyLibrary = { id: string; name: string };

interface LibrarySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSelectedLibraries: string[];
  onSave: (selectedLibraryIds: string[]) => void;
}

export function LibrarySelectionDialog({
  open,
  onOpenChange,
  currentSelectedLibraries,
  onSave,
}: LibrarySelectionDialogProps) {
  const [libraries, setLibraries] = useState<EmbyLibrary[]>([]);
  const [selected, setSelected] = useState<string[]>(currentSelectedLibraries);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  useEffect(() => {
    setSelected(currentSelectedLibraries);
  }, [currentSelectedLibraries]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchEmbyLibraries();
        if (!cancelled) {
          if (result.success) {
            setLibraries(result.data ?? []);
          } else {
            setError(result.error ?? 'Failed to fetch Emby libraries.');
          }
        }
      } catch {
        if (!cancelled) setError('An unexpected error occurred.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    startTransition(() => {
      onSave(selected);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Folder className='h-6 w-6' />
            Select Emby Libraries
          </DialogTitle>
          <DialogDescription>
            Choose which Emby libraries to include when scanning media.
          </DialogDescription>
        </DialogHeader>

        <div className='my-4'>
          <Separator />
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center h-80'>
            <div className='flex flex-col items-center gap-2'>
              <RefreshCw className='h-8 w-8 animate-spin' />
              <p className='text-muted-foreground'>
                Fetching Emby libraries...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center h-80'>
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
              <h3 className='text-lg font-medium'>Available Libraries</h3>
              <Badge variant='secondary'>
                {selected.length} / {libraries.length} selected
              </Badge>
            </div>
            <ScrollArea className='h-[50vh] w-full rounded-md border'>
              <div className='p-4 grid grid-cols-1 lg:grid-cols-2 gap-3'>
                {libraries.map((lib) => (
                  <div
                    key={lib.id}
                    onClick={() => toggle(lib.id)}
                    className={`
                      flex items-start space-x-3 rounded-lg border p-3
                      transition-all cursor-pointer
                      hover:bg-accent hover:text-accent-foreground
                      ${
                        selected.includes(lib.id)
                          ? 'bg-accent/60 border-primary ring-2 ring-primary'
                          : 'bg-transparent'
                      }
                    `}
                  >
                    <Checkbox
                      checked={selected.includes(lib.id)}
                      onCheckedChange={() => toggle(lib.id)}
                      aria-label={`Select library ${lib.name}`}
                      className='mt-1'
                    />
                    <div className='flex-grow'>
                      <div className='flex items-center justify-between'>
                        <span className='font-semibold text-base flex items-center gap-2'>
                          <Folder className='h-5 w-5 text-primary' />
                          {lib.name}
                        </span>
                      </div>
                      <p className='text-xs font-mono truncate text-muted-foreground'>
                        {lib.id}
                      </p>
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
