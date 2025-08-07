'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { AlertTriangle, Database, Trash2, Save, Loader2 } from 'lucide-react';
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

export function AdvancedSettings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // Initialize form data when query data loads
  useEffect(() => {
    if (datePreferenceQuery.data) {
      form.reset({
        datePreference: datePreferenceQuery.data as DatePreference,
      });
    }
  }, [datePreferenceQuery.data, form]);

  const onSubmit = async (data: AdvancedSettingsFormData) => {
    try {
      await updateDatePreferenceMutation.mutateAsync(data.datePreference);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
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

  return (
    <div className='space-y-6'>
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='flex items-center justify-between p-4 border rounded-lg'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-medium'>Date Added Preference</h4>
                    <Badge variant='secondary'>Configuration</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Choose which date to use when calculating age-based deletion
                    scores. &quot;Oldest&quot; will use the earliest date
                    available between Arr and Emby dates.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name='datePreference'
                  render={({ field }) => (
                    <FormItem className='w-36'>
                      <FormControl>
                        <Select
                          disabled={datePreferenceQuery.isLoading}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className='w-36'>
                            <SelectValue
                              placeholder={
                                datePreferenceQuery.isLoading
                                  ? 'Loading...'
                                  : 'Select date preference'
                              }
                            />
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

              {/* Form Actions */}
              <div className='flex justify-end pt-4'>
                <Button
                  type='submit'
                  disabled={
                    datePreferenceQuery.isLoading ||
                    updateDatePreferenceMutation.isPending ||
                    !hasUnsavedChanges
                  }
                  data-testid='save-advanced-settings'
                >
                  {updateDatePreferenceMutation.isPending ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
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
                    disabled={clearMediaItemsMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={handleClearMediaItems}
                    disabled={clearMediaItemsMutation.isPending}
                  >
                    {clearMediaItemsMutation.isPending
                      ? 'Clearing...'
                      : 'Clear All Media Items'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
