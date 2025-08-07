import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Edit2,
  Trash2,
  TestTube,
  Folder,
  Loader2,
  Tv,
  Clapperboard,
  Play,
} from 'lucide-react';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface ServiceInstanceCardProps {
  setting: ServiceSettings;
  connectionStatus?: ConnectionStatus;
  serviceType: 'sonarr' | 'radarr' | 'emby';
  onTestConnection: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSelectFolders: () => void;
  onSelectLibraries?: () => void;
}

export function ServiceInstanceCard({
  setting,
  connectionStatus = 'idle',
  serviceType,
  onTestConnection,
  onEdit,
  onDelete,
  onSelectFolders,
  onSelectLibraries,
}: ServiceInstanceCardProps) {
  const getServiceIcon = () => {
    if (serviceType === 'sonarr') {
      return <Tv className='h-5 w-5' />;
    }
    if (serviceType === 'radarr') {
      return <Clapperboard className='h-5 w-5 text-black' />;
    }
    return <Play className='h-5 w-5' />;
  };

  const getServiceColor = () => {
    if (serviceType === 'sonarr') return 'bg-blue-500';
    if (serviceType === 'radarr') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='flex items-center gap-3'>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${getServiceColor()} text-white`}
          >
            {getServiceIcon()}
          </div>
          <div>
            <CardTitle className='text-lg'>{setting.name}</CardTitle>
            <CardDescription>{setting.url}</CardDescription>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant={setting.enabled ? 'default' : 'secondary'}>
            {setting.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <Badge
            variant={
              connectionStatus === 'success'
                ? 'success'
                : connectionStatus === 'error'
                ? 'destructive'
                : 'secondary'
            }
          >
            {connectionStatus === 'testing' && (
              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
            )}
            {connectionStatus === 'success' && 'Connected'}
            {connectionStatus === 'error' && 'Failed'}
            {connectionStatus === 'idle' && 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div>
            <span className='text-sm font-medium'>API Key</span>
            <p className='text-sm text-muted-foreground'>
              {setting.apiKey.substring(0, 8)}...
            </p>
          </div>
          <div>
            <span className='text-sm font-medium'>
              {serviceType === 'emby'
                ? 'Selected Libraries'
                : 'Selected Folders'}
            </span>
            <p className='text-sm text-muted-foreground'>
              {setting.selectedFolders && setting.selectedFolders.length > 0
                ? `${setting.selectedFolders.length} ${
                    serviceType === 'emby' ? 'library' : 'folder'
                  }(s) selected`
                : serviceType === 'emby'
                ? 'No libraries selected'
                : 'No folders selected'}
            </p>
          </div>
        </div>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={onTestConnection}
            disabled={connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Testing...
              </>
            ) : (
              <>
                <TestTube className='mr-2 h-4 w-4' />
                Test Connection
              </>
            )}
          </Button>
          {serviceType === 'emby' ? (
            <Button
              variant='outline'
              size='sm'
              onClick={onSelectLibraries}
              disabled={!onSelectLibraries}
            >
              <Folder className='mr-2 h-4 w-4' />
              Select Libraries
            </Button>
          ) : (
            <Button variant='outline' size='sm' onClick={onSelectFolders}>
              <Folder className='mr-2 h-4 w-4' />
              Select Folders
            </Button>
          )}
          <Button variant='outline' size='sm' onClick={onEdit}>
            <Edit2 className='mr-2 h-4 w-4' />
            Edit
          </Button>
          <Button variant='outline' size='sm' onClick={onDelete}>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
