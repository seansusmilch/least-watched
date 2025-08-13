'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Server, Trash2, Settings } from 'lucide-react';
import { MediaServices } from '@/components/settings/media-services';
import { DeletionScoreSettings } from '@/components/settings/deletion-score';
import { AdvancedSettings } from '@/components/settings/advanced';
import {
  getSonarrSettings,
  getRadarrSettings,
  getEmbySettings,
} from '@/lib/actions/settings';

// Constants for tab values to prevent typos and improve maintainability
const TAB_VALUES = {
  SERVICES: 'services',
  DELETION: 'deletion',
  ADVANCED: 'advanced',
} as const;

// Reusable loading component
function SettingsLoading() {
  return (
    <AppLayout>
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading settings...</p>
        </div>
      </div>
    </AppLayout>
  );
}

// Reusable error component
function SettingsError() {
  return (
    <AppLayout>
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <p className='text-destructive'>Failed to load settings</p>
          <p className='text-muted-foreground'>
            Please try refreshing the page
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(TAB_VALUES.SERVICES);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

  // Fetch settings with TanStack Query for better caching and error handling
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const [sonarr, radarr, emby] = await Promise.all([
        getSonarrSettings(),
        getRadarrSettings(),
        getEmbySettings(),
      ]);
      return { sonarr, radarr, emby };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2, // Retry failed requests twice
  });

  // Handle URL parameters on mount and when they change
  useEffect(() => {
    const requestedTab = searchParams.get('tab') || TAB_VALUES.SERVICES;
    const tab = requestedTab === 'backup' ? TAB_VALUES.ADVANCED : requestedTab;
    const subTab = searchParams.get('subtab');
    setActiveTab(tab);
    setActiveSubTab(subTab);
  }, [searchParams]);

  // Memoized URL update function to prevent recreating on every render
  const updateUrl = useMemo(() => {
    return (tab: string, subTab?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      if (subTab) {
        params.set('subtab', subTab);
      } else {
        params.delete('subtab');
      }
      router.push(`/settings?${params.toString()}`, { scroll: false });
    };
  }, [searchParams, router]);

  // Optimized tab change handlers with useCallback
  const handleTabChange = useCallback(
    (value: string) => {
      updateUrl(value);
    },
    [updateUrl]
  );

  const handleSubTabChange = useCallback(
    (value: string) => {
      updateUrl(TAB_VALUES.SERVICES, value);
    },
    [updateUrl]
  );

  // Show loading state
  if (isLoading) {
    return <SettingsLoading />;
  }

  // Show error state
  if (error) {
    return <SettingsError />;
  }

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
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className='space-y-4'
        >
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger
              value={TAB_VALUES.SERVICES}
              data-testid='media-services-tab'
              className='flex items-center gap-2'
            >
              <Server className='h-4 w-4' />
              Media Services
            </TabsTrigger>
            <TabsTrigger
              value={TAB_VALUES.DELETION}
              data-testid='deletion-score-tab'
              className='flex items-center gap-2'
            >
              <Trash2 className='h-4 w-4' />
              Deletion Scoring
            </TabsTrigger>
            <TabsTrigger
              value={TAB_VALUES.ADVANCED}
              data-testid='advanced-settings-tab'
              className='flex items-center gap-2'
            >
              <Settings className='h-4 w-4' />
              Advanced
            </TabsTrigger>
            {/* Backup tab removed; backup UI moved under Advanced */}
          </TabsList>

          {/* Media Services */}
          <TabsContent value={TAB_VALUES.SERVICES} className='space-y-4'>
            <MediaServices
              sonarrSettings={settings?.sonarr || []}
              radarrSettings={settings?.radarr || []}
              embySettings={settings?.emby || null}
              activeSubTab={activeSubTab}
              onSubTabChange={handleSubTabChange}
            />
          </TabsContent>

          {/* Deletion Scoring Settings */}
          <TabsContent value={TAB_VALUES.DELETION} className='space-y-4'>
            <DeletionScoreSettings />
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value={TAB_VALUES.ADVANCED} className='space-y-4'>
            <AdvancedSettings />
          </TabsContent>

          {/* Backup moved into Advanced tab */}
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent />
    </Suspense>
  );
}
