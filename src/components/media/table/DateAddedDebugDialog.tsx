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
import { CalendarDays } from 'lucide-react';
import { MediaItem, DatePreference, getEffectiveDateAddedWithSource } from '@/lib/types/media';
import { formatDate } from '@/lib/utils/formatters';
import { getDatePreference } from '@/lib/actions/settings/app-settings';

interface DateAddedDebugDialogProps {
  item: MediaItem;
  children: React.ReactNode;
}

type DateSource = 'arr' | 'emby' | null;

function getSourceReason(source: DateSource, datePreference: DatePreference, hasBothDates: boolean): string {
  if (source === null) return 'No date available from either source.';
  const label = source === 'arr' ? 'Arr' : 'Emby';
  switch (datePreference) {
    case 'arr':
      return source === 'arr'
        ? 'Preference is "arr" and Arr date is available.'
        : 'Preference is "arr" but Arr date is missing — fell back to Emby.';
    case 'emby':
      return source === 'emby'
        ? 'Preference is "emby" and Emby date is available.'
        : 'Preference is "emby" but Emby date is missing — fell back to Arr.';
    case 'oldest':
      if (hasBothDates) return `Preference is "oldest" — ${label} date is earlier${source === 'arr' ? ' (or equal)' : ''}.`;
      return `Preference is "oldest" — only ${label} date is available.`;
  }
}

const DATE_PREFERENCE_DESCRIPTIONS: Record<DatePreference, string> = {
  arr: 'Use Radarr/Sonarr date, fall back to Emby',
  emby: 'Use Emby date, fall back to Radarr/Sonarr',
  oldest: 'Use whichever date is earlier',
};

const SOURCE_BADGE_VARIANTS: Record<'Arr' | 'Emby' | 'Neither', 'default' | 'secondary' | 'outline'> = {
  Arr: 'default',
  Emby: 'secondary',
  Neither: 'outline',
};

export function DateAddedDebugDialog({ item, children }: DateAddedDebugDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: datePreference = 'arr' } = useQuery<DatePreference>({
    queryKey: ['date-preference'],
    queryFn: getDatePreference,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const { date: effectiveDate, source } = getEffectiveDateAddedWithSource(item, datePreference);
  const hasBothDates = !!item.dateAddedEmby && !!item.dateAddedArr;
  const reason = getSourceReason(source, datePreference, hasBothDates);
  const sourceLabel = source === 'arr' ? 'Arr' : source === 'emby' ? 'Emby' : 'Neither';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CalendarDays className='h-4 w-4' />
            Date Added Debug
            <Badge variant='outline'>{item.title}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 text-sm'>
          <section className='space-y-2'>
            <span className='font-medium text-muted-foreground uppercase tracking-wide text-xs'>Inputs</span>
            <div className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center'>
              <span className='text-muted-foreground'>Emby date</span>
              <code className='bg-muted px-1.5 py-0.5 rounded text-xs font-mono'>
                {formatDate(item.dateAddedEmby)}
              </code>
              <span className='text-muted-foreground'>Arr date</span>
              <code className='bg-muted px-1.5 py-0.5 rounded text-xs font-mono'>
                {formatDate(item.dateAddedArr)}
              </code>
            </div>
          </section>

          <section className='space-y-2'>
            <span className='font-medium text-muted-foreground uppercase tracking-wide text-xs'>Setting</span>
            <div className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center'>
              <span className='text-muted-foreground'>Date preference</span>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary'>{datePreference}</Badge>
                <span className='text-xs text-muted-foreground'>{DATE_PREFERENCE_DESCRIPTIONS[datePreference]}</span>
              </div>
            </div>
          </section>

          <section className='space-y-2'>
            <span className='font-medium text-muted-foreground uppercase tracking-wide text-xs'>Outcome</span>
            <div className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 items-center'>
              <span className='text-muted-foreground'>Effective date</span>
              <code className='bg-muted px-1.5 py-0.5 rounded text-xs font-mono'>
                {formatDate(effectiveDate)}
              </code>
              <span className='text-muted-foreground'>Source used</span>
              <Badge variant={SOURCE_BADGE_VARIANTS[sourceLabel]}>{sourceLabel}</Badge>
            </div>
            <p className='text-xs text-muted-foreground pt-0.5'>{reason}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
