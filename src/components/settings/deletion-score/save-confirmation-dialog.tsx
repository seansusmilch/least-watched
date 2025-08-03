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

interface SaveConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  validation: { isValid: boolean; message: string };
}

export function SaveConfirmationDialog({
  open,
  onOpenChange,
  onSave,
  validation,
}: SaveConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Settings Save</DialogTitle>
          <DialogDescription>
            Saving these deletion score settings will trigger a recalculation of
            all deletion scores in your media library. This process may take
            several minutes for large libraries and will run in the background.
            <br />
            <br />
            Are you sure you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button onClick={onSave} disabled={!validation.isValid}>
            Save & Recalculate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
