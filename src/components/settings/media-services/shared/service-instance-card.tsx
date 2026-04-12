import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  countUniqueNonEmptyStrings,
  countUniqueNormalizedFolderPaths,
} from '@/lib/utils/selected-paths';
import { cn } from '@/lib/utils';

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
    if (serviceType === 'sonarr') return <Tv className='h-4 w-4 text-white' />;
    if (serviceType === 'radarr') return <Clapperboard className='h-4 w-4 text-black' />;
    return <Play className='h-4 w-4 text-white' />;
  };

  const getServiceColor = () => {
    if (serviceType === 'sonarr') return 'bg-blue-500';
    if (serviceType === 'radarr') return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const selectedCount =
    serviceType === 'emby'
      ? countUniqueNonEmptyStrings(setting.selectedFolders)
      : countUniqueNormalizedFolderPaths(setting.selectedFolders);

  const folderLabel = serviceType === 'emby' ? 'librar' : 'folder';

  return (
    <div className='py-4 border-b flex flex-col gap-3'>
      {/* Top row: icon + name/url + badges */}
      <div className='flex items-start justify-between gap-3 min-w-0'>
        <div className='flex items-center gap-3 min-w-0'>
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
              getServiceColor()
            )}
          >
            {getServiceIcon()}
          </div>
          <div className='min-w-0'>
            <p className='font-medium leading-tight'>{setting.name}</p>
            <p className='text-xs text-muted-foreground font-mono truncate' title={setting.url}>
              {setting.url}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-1.5 shrink-0'>
          <Badge variant={setting.enabled ? 'default' : 'secondary'} className='text-[10px]'>
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
            className='text-[10px]'
          >
            {connectionStatus === 'testing' && (
              <Loader2 className='mr-1 h-3 w-3 animate-spin' />
            )}
            {connectionStatus === 'success' && 'Connected'}
            {connectionStatus === 'error' && 'Failed'}
            {connectionStatus === 'idle' && 'Unknown'}
          </Badge>
        </div>
      </div>

      {/* Meta row: api key + folder count */}
      <div className='flex items-center gap-6 text-xs text-muted-foreground'>
        <span>
          <span className='text-foreground font-medium'>API</span>{' '}
          <span className='font-mono'>{setting.apiKey.substring(0, 8)}…</span>
        </span>
        <span>
          <span className='text-foreground font-medium'>
            {serviceType === 'emby' ? 'Libraries' : 'Folders'}
          </span>{' '}
          {selectedCount > 0
            ? `${selectedCount} ${folderLabel}${selectedCount !== 1 ? (serviceType === 'emby' ? 'ies' : 's') : 'y'} selected`
            : `No ${folderLabel}ies selected`}
        </span>
      </div>

      {/* Action buttons */}
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={onTestConnection}
          disabled={connectionStatus === 'testing'}
        >
          {connectionStatus === 'testing' ? (
            <><Loader2 className='mr-2 h-4 w-4 animate-spin' />Testing…</>
          ) : (
            <><TestTube className='mr-2 h-4 w-4' />Test Connection</>
          )}
        </Button>
        {serviceType === 'emby' ? (
          <Button variant='outline' size='sm' onClick={onSelectLibraries} disabled={!onSelectLibraries}>
            <Folder className='mr-2 h-4 w-4' />Select Libraries
          </Button>
        ) : (
          <Button variant='outline' size='sm' onClick={onSelectFolders}>
            <Folder className='mr-2 h-4 w-4' />Select Folders
          </Button>
        )}
        <Button variant='outline' size='sm' onClick={onEdit}>
          <Edit2 className='mr-2 h-4 w-4' />Edit
        </Button>
        <Button variant='outline' size='sm' onClick={onDelete}>
          <Trash2 className='mr-2 h-4 w-4' />Delete
        </Button>
      </div>
    </div>
  );
}
