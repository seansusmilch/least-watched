import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';

interface ServiceInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSetting?: ServiceSettings | null;
  serviceType: 'sonarr' | 'radarr';
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function ServiceInstanceDialog({
  open,
  onOpenChange,
  editingSetting,
  serviceType,
  onSubmit,
  onCancel,
}: ServiceInstanceDialogProps) {
  const isEditing = !!editingSetting;
  const serviceName = serviceType === 'sonarr' ? 'Sonarr' : 'Radarr';
  const serviceDescription =
    serviceType === 'sonarr' ? 'TV show management' : 'movie management';
  const defaultPort = serviceType === 'sonarr' ? '8989' : '7878';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid='add-instance-dialog'>
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Edit ${serviceName} Instance`
              : `Add ${serviceName} Instance`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update your ${serviceName} instance configuration`
              : `Add a new ${serviceName} instance to manage your ${serviceDescription}`}
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              name='name'
              data-testid='instance-name'
              defaultValue={editingSetting?.name || ''}
              required
            />
          </div>
          <div>
            <Label htmlFor='url'>URL</Label>
            <Input
              id='url'
              name='url'
              type='url'
              data-testid='instance-url'
              defaultValue={editingSetting?.url || ''}
              placeholder={`http://localhost:${defaultPort}`}
              required
            />
          </div>
          <div>
            <Label htmlFor='apiKey'>API Key</Label>
            <Input
              id='apiKey'
              name='apiKey'
              data-testid='instance-api-key'
              defaultValue={editingSetting?.apiKey || ''}
              required
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='enabled'
              name='enabled'
              defaultChecked={editingSetting?.enabled ?? true}
            />
            <Label htmlFor='enabled'>Enabled</Label>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' data-testid='save-instance'>
              {isEditing ? 'Update' : 'Create'} Instance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
