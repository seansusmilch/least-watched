'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { AlertTriangle, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { useAdvancedSettings } from '@/hooks/useAdvancedSettings';
import {
  AdvancedSettingsSchema,
  type AdvancedSettingsFormData,
} from '@/lib/validation/schemas';
import type { DatePreference } from '@/lib/types/media';
import { DatePreferenceConfirmationDialog } from './date-preference-confirmation-dialog';
import { AllSettingsBackup } from '@/components/settings/backup';

export function AdvancedSettings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDatePreferenceConfirmDialog, setShowDatePreferenceConfirmDialog] =
    useState(false);
  const [pendingDatePreference, setPendingDatePreference] =
    useState<DatePreference | null>(null);

  const {
    datePreferenceQuery,
    updateDatePreferenceMutation,
    clearMediaItemsMutation,
  } = useAdvancedSettings();

  const form = useForm<AdvancedSettingsFormData>({
    resolver: zodResolver(AdvancedSettingsSchema),
    defaultValues: {
      datePreference: 'arr',
    },
  });

  // Update form values when query data is available
  useEffect(() => {
    if (
      datePreferenceQuery.data &&
      form.getValues('datePreference') !== datePreferenceQuery.data
    ) {
      form.reset({
        datePreference: datePreferenceQuery.data,
      });
    }
  }, [datePreferenceQuery.data, form]);

  const onSubmit = async (data: AdvancedSettingsFormData) => {
    const currentValue = datePreferenceQuery.data || 'arr';

    // If the date preference is changing, show confirmation dialog
    if (data.datePreference !== currentValue) {
      setPendingDatePreference(data.datePreference);
      setShowDatePreferenceConfirmDialog(true);
      return;
    }

    // If no change, just save normally
    await handleDatePreferenceUpdate(data.datePreference);
  };

  const handleDatePreferenceUpdate = async (datePreference: DatePreference) => {
    try {
      const result = await updateDatePreferenceMutation.mutateAsync(
        datePreference
      );

      if (result.recalculationTriggered) {
        toast.success(
          'Date preference updated successfully. Deletion scores are being recalculated in the background.'
        );
      } else {
        toast.success('Date preference updated successfully.');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
    }
  };

  const handleConfirmDatePreferenceChange = async () => {
    if (pendingDatePreference) {
      await handleDatePreferenceUpdate(pendingDatePreference);
      setShowDatePreferenceConfirmDialog(false);
      setPendingDatePreference(null);
    }
  };

  const handleClearMediaItems = async () => {
    try {
      const result = await clearMediaItemsMutation.mutateAsync();
      toast.success(result.message || 'Media items cleared successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to clear media items'
      );
    } finally {
      setIsDialogOpen(false);
    }
  };

  const hasUnsavedChanges =
    form.formState.isDirty && !updateDatePreferenceMutation.isPending;

  // Show loading state while query is loading
  if (datePreferenceQuery.isLoading) {
    return (
      <div className='py-8 flex items-center gap-2 text-sm text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin' />
        Loading settings…
      </div>
    );
  }

  return (
    <div className='space-y-0'>
      {/* Date Preference */}
      <div className='py-5 border-b space-y-4'>
        <p className='text-xs uppercase tracking-widest text-muted-foreground font-medium'>
          Configuration
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 py-2'>
              <div className='space-y-1 max-w-md'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-sm font-medium'>Date Added Preference</h4>
                  <Badge variant='secondary' className='text-[10px]'>Configuration</Badge>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Which date to use when calculating age-based deletion scores.
                  &ldquo;Oldest&rdquo; uses the earliest date between Arr and Emby.
                </p>
                <p className='text-xs text-muted-foreground'>
                  <strong>Changing this will recalculate all deletion scores.</strong>
                </p>
              </div>
              <FormField
                control={form.control}
                name='datePreference'
                render={({ field }) => (
                  <FormItem className='w-40 shrink-0'>
                    <FormControl>
                      <Select
                        disabled={datePreferenceQuery.isLoading}
                        onValueChange={field.onChange}
                        value={field.value || datePreferenceQuery.data || 'arr'}
                      >
                        <SelectTrigger className='w-40'>
                          <SelectValue placeholder='Select…' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='arr'>Arr Date</SelectItem>
                          <SelectItem value='emby'>Emby Date</SelectItem>
                          <SelectItem value='oldest'>Oldest Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='flex justify-end pt-2'>
              <Button
                type='submit'
                size='sm'
                disabled={
                  datePreferenceQuery.isLoading ||
                  updateDatePreferenceMutation.isPending ||
                  !hasUnsavedChanges
                }
                data-testid='save-advanced-settings'
              >
                {updateDatePreferenceMutation.isPending ? (
                  <><Loader2 className='h-4 w-4 mr-2 animate-spin' />Saving…</>
                ) : (
                  <><Save className='h-4 w-4 mr-2' />Save Settings</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <AllSettingsBackup />

      {/* Database */}
      <div className='py-5 border-b space-y-4'>
        <p className='text-xs uppercase tracking-widest text-muted-foreground font-medium'>
          Database
        </p>
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 py-2'>
          <div className='space-y-1 max-w-md'>
            <div className='flex items-center gap-2'>
              <h4 className='text-sm font-medium'>Clear Media Items</h4>
              <Badge variant='destructive' className='text-[10px]'>Destructive</Badge>
            </div>
            <p className='text-xs text-muted-foreground'>
              Remove all media items from the database. This will not affect your actual media files.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant='destructive' size='sm' className='shrink-0'>
                <Trash2 className='h-4 w-4 mr-2' />Clear All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                  <AlertTriangle className='h-5 w-5 text-destructive' />
                  Clear Media Items
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to clear all media items? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className='bg-muted p-4 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-destructive mt-0.5 shrink-0' />
                  <div className='space-y-2'>
                    <p className='text-sm font-medium'>This will:</p>
                    <ul className='text-sm text-muted-foreground space-y-1'>
                      <li>• Remove all media items from the database</li>
                      <li>• Clear watch history and deletion scores</li>
                      <li>• Reset all media processing data</li>
                      <li>• <strong>NOT</strong> affect your actual media files</li>
                    </ul>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setIsDialogOpen(false)}
                  disabled={clearMediaItemsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant='destructive'
                  onClick={handleClearMediaItems}
                  disabled={clearMediaItemsMutation.isPending}
                >
                  {clearMediaItemsMutation.isPending ? 'Clearing…' : 'Clear All Media Items'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Preference Confirmation Dialog */}
      <DatePreferenceConfirmationDialog
        open={showDatePreferenceConfirmDialog}
        onOpenChange={setShowDatePreferenceConfirmDialog}
        onSave={handleConfirmDatePreferenceChange}
        currentValue={datePreferenceQuery.data || 'arr'}
        newValue={pendingDatePreference || 'arr'}
      />
    </div>
  );
}
