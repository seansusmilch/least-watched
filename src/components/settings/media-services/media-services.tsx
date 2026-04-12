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

  const tabTriggerClass =
    'rounded-none border-b-2 border-transparent -mb-px data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none px-4 pb-3 pt-1 font-medium text-muted-foreground hover:text-foreground transition-colors gap-1.5';

  return (
    <div className='space-y-6'>
      <Tabs
        value={activeSubTab || 'sonarr'}
        onValueChange={onSubTabChange}
        className='space-y-6'
      >
        <TabsList className='bg-transparent rounded-none p-0 h-auto border-b w-full justify-start gap-0'>
          <TabsTrigger value='sonarr' className={tabTriggerClass}>
            <Tv className='h-4 w-4' />
            Sonarr
            <Badge variant='secondary' className='ml-0.5 tabular-nums'>
              {sonarrSettings.filter((s) => s.enabled).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='radarr' className={tabTriggerClass}>
            <Clapperboard className='h-4 w-4' />
            Radarr
            <Badge variant='secondary' className='ml-0.5 tabular-nums'>
              {radarrSettings.filter((s) => s.enabled).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='emby' className={tabTriggerClass}>
            <Play className='h-4 w-4' />
            Emby
            {embyStatus ? (
              <CheckCircle className='h-3.5 w-3.5 text-green-500 ml-0.5' />
            ) : (
              <X className='h-3.5 w-3.5 text-muted-foreground ml-0.5' />
            )}
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
