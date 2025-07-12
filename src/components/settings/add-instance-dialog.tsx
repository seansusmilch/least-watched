'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type?: 'text' | 'password';
  placeholder: string;
  required?: boolean;
}

interface AddInstanceDialogProps<
  T extends Record<string, unknown> = Record<string, unknown>
> {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: ReactNode;
  formData: T;
  onFormDataChange: (field: string, value: string | boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  fields: FormField[];
  showEnabledSwitch?: boolean;
}

export function AddInstanceDialog({
  title,
  open,
  onOpenChange,
  triggerButton,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  isPending,
  fields,
  showEnabledSwitch = true,
}: AddInstanceDialogProps) {
  const defaultTrigger = (
    <Button>
      <Plus className='h-4 w-4 mr-2' />
      Add Instance
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerButton || defaultTrigger}</DialogTrigger>
      <DialogContent className='bg-background text-foreground border border-border'>
        <DialogHeader>
          <DialogTitle className='text-foreground'>{title}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          {fields.map((field) => (
            <div key={field.id} className='space-y-2'>
              <Label htmlFor={field.id} className='text-foreground'>
                {field.label}
                {field.required && (
                  <span className='text-destructive ml-1'>*</span>
                )}
              </Label>
              <Input
                id={field.id}
                type={field.type || 'text'}
                value={String(formData[field.id] || '')}
                onChange={(e) => onFormDataChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                className='bg-background text-foreground border-border focus:border-ring focus:ring-ring'
              />
            </div>
          ))}

          {showEnabledSwitch && (
            <div className='flex items-center space-x-2'>
              <Switch
                id='enabled'
                checked={Boolean(formData.enabled)}
                onCheckedChange={(enabled) =>
                  onFormDataChange('enabled', enabled)
                }
              />
              <Label htmlFor='enabled' className='text-foreground'>
                Enable this instance
              </Label>
            </div>
          )}

          <div className='flex justify-end space-x-2'>
            <Button
              variant='outline'
              onClick={onCancel}
              className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isPending}
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
