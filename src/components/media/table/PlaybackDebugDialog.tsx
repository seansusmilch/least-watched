'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, Eye } from 'lucide-react';
import { MediaItem } from '@/lib/types/media';
import { getPlaybackDebugInfo } from '@/lib/actions/media-items';

interface PlaybackDebugDialogProps {
  item: MediaItem;
  children: React.ReactNode;
}

export function PlaybackDebugDialog({ item, children }: PlaybackDebugDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ['playback-debug', item.id],
    queryFn: () => getPlaybackDebugInfo({
      type: item.type as 'movie' | 'tv',
      embyId: item.embyId,
      title: item.title,
    }),
    enabled: open,
  });

  const handleCopy = async () => {
    if (!result?.sql) return;
    await navigator.clipboard.writeText(result.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Eye className='h-4 w-4' />
            <span>Playback Query Debug</span>
            <Badge variant='outline'>{item.title}</Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        ) : !result ? (
          <div className='text-sm text-muted-foreground p-4'>
            No Emby settings configured or query could not be built for this item.
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex gap-2 flex-wrap text-sm text-muted-foreground'>
              <span>Type: <Badge variant='secondary'>{item.type}</Badge></span>
              {item.embyId && <span>Emby ID: <code className='bg-muted px-1 rounded text-xs'>{item.embyId}</code></span>}
              <span>Watch count stored: <Badge variant='outline'>{item.watchCount}</Badge></span>
              <span>Last watched stored: <Badge variant='outline'>{item.lastWatched ? new Date(item.lastWatched).toLocaleDateString() : 'Never'}</Badge></span>
            </div>

            <div>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-sm font-medium'>SQL Query</span>
                <Button variant='ghost' size='sm' onClick={handleCopy} className='h-7 px-2'>
                  {copied ? <Check className='h-3 w-3 mr-1' /> : <Copy className='h-3 w-3 mr-1' />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className='bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono border'>
                {result.sql}
              </pre>
            </div>

            <div>
              <span className='text-sm font-medium'>Query Results</span>
              {result.rows.length === 0 ? (
                <p className='text-sm text-muted-foreground mt-1'>No rows returned.</p>
              ) : (
                <div className='mt-1 overflow-x-auto border rounded-md'>
                  <table className='text-xs w-full'>
                    <thead className='bg-muted'>
                      <tr>
                        {(result.columns.length > 0 ? result.columns : result.rows[0].map((_, i) => `col${i}`)).map((col, i) => (
                          <th key={i} className='px-3 py-2 text-left font-medium border-r last:border-r-0'>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, ri) => (
                        <tr key={ri} className='border-t'>
                          {row.map((cell, ci) => (
                            <td key={ci} className='px-3 py-2 font-mono border-r last:border-r-0'>
                              {cell === null || cell === undefined ? <span className='text-muted-foreground italic'>null</span> : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
