'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Database, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { clearMediaItems } from '@/lib/actions/media-processing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function AdvancedSettings() {
  const [isClearing, setIsClearing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClearMediaItems = async () => {
    setIsClearing(true);
    try {
      const result = await clearMediaItems();
      if (result.success) {
      } else {
        toast.error(result.error || 'Failed to clear media items');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsClearing(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Database className='h-5 w-5' />
            Database Management
          </CardTitle>
          <CardDescription>
            Manage your application&apos;s database and stored media information
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between p-4 border rounded-lg'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <h4 className='font-medium'>Clear Media Items</h4>
                <Badge variant='destructive'>Destructive</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Remove all media items from the database. This will not affect
                your actual media files.
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='destructive' size='sm'>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Clear All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5 text-destructive' />
                    Clear Media Items
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to clear all media items from the
                    database? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className='bg-muted p-4 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <AlertTriangle className='h-5 w-5 text-destructive mt-0.5' />
                    <div className='space-y-2'>
                      <p className='text-sm font-medium'>This will:</p>
                      <ul className='text-sm text-muted-foreground space-y-1'>
                        <li>• Remove all media items from the database</li>
                        <li>• Clear watch history and deletion scores</li>
                        <li>• Reset all media processing data</li>
                        <li>
                          • <strong>NOT</strong> affect your actual media files
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isClearing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={handleClearMediaItems}
                    disabled={isClearing}
                  >
                    {isClearing ? 'Clearing...' : 'Clear All Media Items'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            Advanced Configuration
          </CardTitle>
          <CardDescription>
            Advanced settings and configuration options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Additional advanced configuration options will be available here in
            future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
