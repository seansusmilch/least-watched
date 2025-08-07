'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface DatePreferenceConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  currentValue: string;
  newValue: string;
}

export function DatePreferenceConfirmationDialog({
  open,
  onOpenChange,
  onSave,
  currentValue,
  newValue,
}: DatePreferenceConfirmationDialogProps) {
  const getDisplayName = (value: string) => {
    switch (value) {
      case 'arr':
        return 'Arr Date';
      case 'emby':
        return 'Emby Date';
      case 'oldest':
        return 'Oldest Date';
      default:
        return value;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-orange-500' />
            Confirm Date Preference Change
          </DialogTitle>
          <DialogDescription className='space-y-2'>
            You are changing the date preference from{' '}
            <strong>{getDisplayName(currentValue)}</strong> to{' '}
            <strong>{getDisplayName(newValue)}</strong>.
            <strong>
              This will trigger a recalculation of all deletion scores
            </strong>{' '}
            for existing media items, as the age-based scoring depends on the
            selected date preference. This process may take several minutes for
            large libraries and will run in the background.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button onClick={onSave}>Save & Recalculate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
