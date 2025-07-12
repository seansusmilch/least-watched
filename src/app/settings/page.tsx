import { AppLayout } from '@/components/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Server, Trash2 } from 'lucide-react';

import { MediaServices } from '@/components/settings/media-services';
import { DeletionScoreSettings } from '@/components/settings/deletion-score-settings';
import {
  getSonarrSettings,
  getRadarrSettings,
  getEmbySettings,
} from '@/lib/actions/settings';

export default async function SettingsPage() {
  // Fetch all settings from database
  const [sonarrSettings, radarrSettings, embySettings] = await Promise.all([
    getSonarrSettings(),
    getRadarrSettings(),
    getEmbySettings(),
  ]);

  return (
    <AppLayout>
      <div className='space-y-6'>
        {/* Page Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
            <p className='text-muted-foreground'>
              Configure your media management system
            </p>
          </div>
        </div>

        <Separator />

        {/* Settings Tabs */}
        <Tabs defaultValue='services' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='services' className='flex items-center gap-2'>
              <Server className='h-4 w-4' />
              Media Services
            </TabsTrigger>
            <TabsTrigger value='deletion' className='flex items-center gap-2'>
              <Trash2 className='h-4 w-4' />
              Deletion Scoring
            </TabsTrigger>
          </TabsList>

          {/* Media Services */}
          <TabsContent value='services' className='space-y-4'>
            <MediaServices
              sonarrSettings={sonarrSettings}
              radarrSettings={radarrSettings}
              embySettings={embySettings}
            />
          </TabsContent>

          {/* Deletion Scoring Settings */}
          <TabsContent value='deletion' className='space-y-4'>
            <DeletionScoreSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
