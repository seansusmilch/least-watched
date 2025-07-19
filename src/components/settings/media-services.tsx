'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Globe, Database } from 'lucide-react';
import type { ServiceSettings } from '@/lib/utils/prefixed-settings';

import { SonarrSettings } from './sonarr-settings';
import { RadarrSettings } from './radarr-settings';
import { EmbySettings } from './emby-settings';

interface MediaServicesProps {
  sonarrSettings: ServiceSettings[];
  radarrSettings: ServiceSettings[];
  embySettings: ServiceSettings[];
}

export function MediaServices({
  sonarrSettings,
  radarrSettings,
  embySettings,
}: MediaServicesProps) {
  // For Emby, show 1 if there's an enabled instance, 0 if none or disabled
  const embyStatus = embySettings.length > 0 && embySettings[0].enabled ? 1 : 0;

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
      <Tabs defaultValue='sonarr' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='sonarr' className='flex items-center gap-2'>
            <Monitor className='h-4 w-4' />
            Sonarr
            <Badge variant='secondary' className='ml-1'>
              {sonarrSettings.filter((s) => s.enabled).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='radarr' className='flex items-center gap-2'>
            <Globe className='h-4 w-4' />
            Radarr
            <Badge variant='secondary' className='ml-1'>
              {radarrSettings.filter((s) => s.enabled).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='emby' className='flex items-center gap-2'>
            <Database className='h-4 w-4' />
            Emby
            <Badge variant='secondary' className='ml-1'>
              {embyStatus}
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
          <EmbySettings initialSettings={embySettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
