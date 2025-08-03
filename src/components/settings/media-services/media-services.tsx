'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv, Clapperboard, Play, CheckCircle, X } from 'lucide-react';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';

import { SonarrSettings } from './sonarr/sonarr-settings';
import { RadarrSettings } from './radarr/radarr-settings';
import { EmbySettingsTab } from './emby/emby-settings';
import type { EmbySettings } from '@/lib/utils/single-emby-settings';
interface MediaServicesProps {
  sonarrSettings: ServiceSettings[];
  radarrSettings: ServiceSettings[];
  embySettings: EmbySettings | null;
  activeSubTab?: string | null;
  onSubTabChange?: (value: string) => void;
}

export function MediaServices({
  sonarrSettings,
  radarrSettings,
  embySettings,
  activeSubTab,
  onSubTabChange,
}: MediaServicesProps) {
  const embyStatus = embySettings?.enabled;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold'>Media Services</h2>
        <p className='text-muted-foreground'>
          Configure connections to your media management services
        </p>
      </div>

      {/* Service Configuration Tabs */}
      <Tabs
        value={activeSubTab || 'sonarr'}
        onValueChange={onSubTabChange}
        className='space-y-4'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='sonarr' className='flex items-center gap-2'>
            <Tv className='h-4 w-4' />
            Sonarr
            <Badge variant='secondary' className='ml-1'>
              {sonarrSettings.filter((s) => s.enabled).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='radarr' className='flex items-center gap-2'>
            <Clapperboard className='h-4 w-4' />
            Radarr
            <Badge variant='secondary' className='ml-1'>
              {radarrSettings.filter((s) => s.enabled).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='emby' className='flex items-center gap-2'>
            <Play className='h-4 w-4' />
            Emby
            <Badge variant='secondary' className='ml-1'>
              {embyStatus ? (
                <CheckCircle className='h-4 w-4' />
              ) : (
                <X className='h-4 w-4' />
              )}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='sonarr' className='space-y-4'>
          <SonarrSettings initialSettings={sonarrSettings} />
        </TabsContent>

        <TabsContent value='radarr' className='space-y-4'>
          <RadarrSettings initialSettings={radarrSettings} />
        </TabsContent>

        <TabsContent value='emby' className='space-y-4'>
          <EmbySettingsTab initialSettings={embySettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
