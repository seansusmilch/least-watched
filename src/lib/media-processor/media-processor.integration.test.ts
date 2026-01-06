import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { MediaProcessor } from './media-processor';
import { PrismaClient } from '@/generated/prisma';
import { ProgressStore } from './progress-store';
import type { MediaProcessingProgress } from '@/lib/types/media-processing';
import type Emby from 'emby-sdk-stainless';

const prisma = new PrismaClient();

// Prevent network requests in tests
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.CI === 'true';

describe('MediaProcessor Integration Tests', () => {
  beforeEach(async () => {
    await prisma.mediaItem.deleteMany();
    await ProgressStore.clearProgress();
  });

  afterEach(async () => {
    await prisma.mediaItem.deleteMany();
    await ProgressStore.clearProgress();
  });

  test('should return empty array when no Emby instance is enabled', async () => {
    if (!TEST_MODE) {
      console.warn('Skipping test that requires mocking - set NODE_ENV=test or CI=true');
      return;
    }

    const singleEmbySettingsService = await import('@/lib/utils/single-emby-settings');
    const mockGetEnabled = spyOn(
      singleEmbySettingsService.singleEmbySettingsService,
      'getEnabled'
    ).mockResolvedValue(null);

    const processor = new MediaProcessor();
    const result = await processor.processAllMedia();

    expect(result).toEqual([]);
    expect(mockGetEnabled).toHaveBeenCalled();

    mockGetEnabled.mockRestore();
  });

  test('should process items and update progress', async () => {
    let progressUpdates: MediaProcessingProgress[] = [];

    const onProgress = (progress: MediaProcessingProgress) => {
      progressUpdates.push(progress);
    };

    const processor = new MediaProcessor(onProgress);

    const mockEmbyInstance = {
      name: 'Test Emby',
      url: 'http://localhost:8096',
      apiKey: 'test-key',
      enabled: true,
      selectedLibraries: [],
    };

    const mockEmbyItems: Emby.BaseItem[] = [
      {
        Id: '1',
        Name: 'Test Movie',
        Type: 'Movie',
        ProductionYear: 2023,
        Path: '/media/movies/test',
        DateCreated: '2023-01-01T00:00:00Z',
        ProviderIds: {
          tmdb: '100',
          imdb: 'tt001',
        },
      } as Emby.BaseItem,
    ];

    const mockGetEnabled = mock(() => Promise.resolve(mockEmbyInstance));
    const mockListLibraryItems = mock(() => Promise.resolve(mockEmbyItems));
    const mockGetAggregatedPlaybackInfo = mock(() =>
      Promise.resolve({
        lastWatched: new Date('2023-06-01'),
        watchCount: 5,
        embyId: '1',
      })
    );

    const singleEmbySettingsService = await import('@/lib/utils/single-emby-settings');
    const EmbyService = await import('@/lib/services/emby-service');
    const sonarrApiClient = await import('@/lib/services/sonarr-service');
    const radarrApiClient = await import('@/lib/services/radarr-service');
    const sonarrSettingsService = await import('@/lib/database');
    const radarrSettingsService = await import('@/lib/database');
    const getDatePreference = await import('@/lib/actions/settings/app-settings');
    const getDeletionScoreSettings = await import('@/lib/actions/settings');
    const folderSpaceService = await import('@/lib/services/folder-space-service');

    const originalGetEnabled = singleEmbySettingsService.singleEmbySettingsService.getEnabled;
    const originalListLibraryItems = EmbyService.EmbyService.listLibraryItems;
    const originalGetAggregatedPlaybackInfo = EmbyService.EmbyService.getAggregatedPlaybackInfo;
    const originalGetSeries = sonarrApiClient.sonarrApiClient.getSeries;
    const originalGetMovies = radarrApiClient.radarrApiClient.getMovies;
    const originalGetEnabledSonarr = sonarrSettingsService.sonarrSettingsService.getEnabled;
    const originalGetEnabledRadarr = radarrSettingsService.radarrSettingsService.getEnabled;
    const originalGetDatePreference = getDatePreference.getDatePreference;
    const originalGetDeletionScoreSettings = getDeletionScoreSettings.getDeletionScoreSettings;
    const originalGetFolderSpaceData = folderSpaceService.folderSpaceService.getFolderSpaceData;

    singleEmbySettingsService.singleEmbySettingsService.getEnabled = mockGetEnabled;
    EmbyService.EmbyService.listLibraryItems = mockListLibraryItems;
    EmbyService.EmbyService.getAggregatedPlaybackInfo = mockGetAggregatedPlaybackInfo;
    sonarrApiClient.sonarrApiClient.getSeries = mock(() => Promise.resolve([]));
    radarrApiClient.radarrApiClient.getMovies = mock(() => Promise.resolve([]));
    sonarrSettingsService.sonarrSettingsService.getEnabled = mock(() => Promise.resolve([]));
    radarrSettingsService.radarrSettingsService.getEnabled = mock(() => Promise.resolve([]));
    getDatePreference.getDatePreference = mock(() => Promise.resolve('arr'));
    getDeletionScoreSettings.getDeletionScoreSettings = mock(() =>
      Promise.resolve({
        enabled: false,
        daysUnwatchedEnabled: false,
        daysUnwatchedMaxPoints: 0,
        daysUnwatchedBreakpoints: [],
        neverWatchedEnabled: false,
        neverWatchedPoints: 0,
        sizeOnDiskEnabled: false,
        sizeOnDiskMaxPoints: 0,
        sizeOnDiskBreakpoints: [],
        ageSinceAddedEnabled: false,
        ageSinceAddedMaxPoints: 0,
        ageSinceAddedBreakpoints: [],
        folderSpaceEnabled: false,
        folderSpaceMaxPoints: 0,
        folderSpaceBreakpoints: [],
      })
    );
    folderSpaceService.folderSpaceService.getFolderSpaceData = mock(() => Promise.resolve([]));

    const result = await processor.processAllMedia();

    expect(result.length).toBeGreaterThan(0);
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0]?.phase).toBe('Initializing');

    const completeProgress = progressUpdates.find((p) => p.phase === 'Complete');
    expect(completeProgress).toBeDefined();
    expect(completeProgress?.isComplete).toBe(true);

    singleEmbySettingsService.singleEmbySettingsService.getEnabled = originalGetEnabled;
    EmbyService.EmbyService.listLibraryItems = originalListLibraryItems;
    EmbyService.EmbyService.getAggregatedPlaybackInfo = originalGetAggregatedPlaybackInfo;
    sonarrApiClient.sonarrApiClient.getSeries = originalGetSeries;
    radarrApiClient.radarrApiClient.getMovies = originalGetMovies;
    sonarrSettingsService.sonarrSettingsService.getEnabled = originalGetEnabledSonarr;
    radarrSettingsService.radarrSettingsService.getEnabled = originalGetEnabledRadarr;
    getDatePreference.getDatePreference = originalGetDatePreference;
    getDeletionScoreSettings.getDeletionScoreSettings = originalGetDeletionScoreSettings;
    folderSpaceService.folderSpaceService.getFolderSpaceData = originalGetFolderSpaceData;
  });

  test('should skip items without Id', async () => {
    const mockEmbyInstance = {
      name: 'Test Emby',
      url: 'http://localhost:8096',
      apiKey: 'test-key',
      enabled: true,
      selectedLibraries: [],
    };

    const mockEmbyItems: Emby.BaseItem[] = [
      {
        Id: null as unknown as string,
        Name: 'Test Movie',
        Type: 'Movie',
      } as Emby.BaseItem,
      {
        Id: '2',
        Name: 'Valid Movie',
        Type: 'Movie',
        DateCreated: '2023-01-01T00:00:00Z',
      } as Emby.BaseItem,
    ];

    const mockGetEnabled = mock(() => Promise.resolve(mockEmbyInstance));
    const mockListLibraryItems = mock(() => Promise.resolve(mockEmbyItems));

    const singleEmbySettingsService = await import('@/lib/utils/single-emby-settings');
    const EmbyService = await import('@/lib/services/emby-service');
    const sonarrApiClient = await import('@/lib/services/sonarr-service');
    const radarrApiClient = await import('@/lib/services/radarr-service');
    const sonarrSettingsService = await import('@/lib/database');
    const radarrSettingsService = await import('@/lib/database');
    const getDatePreference = await import('@/lib/actions/settings/app-settings');
    const getDeletionScoreSettings = await import('@/lib/actions/settings');
    const folderSpaceService = await import('@/lib/services/folder-space-service');

    const originalGetEnabled = singleEmbySettingsService.singleEmbySettingsService.getEnabled;
    const originalListLibraryItems = EmbyService.EmbyService.listLibraryItems;
    const originalGetSeries = sonarrApiClient.sonarrApiClient.getSeries;
    const originalGetMovies = radarrApiClient.radarrApiClient.getMovies;
    const originalGetEnabledSonarr = sonarrSettingsService.sonarrSettingsService.getEnabled;
    const originalGetEnabledRadarr = radarrSettingsService.radarrSettingsService.getEnabled;
    const originalGetDatePreference = getDatePreference.getDatePreference;
    const originalGetDeletionScoreSettings = getDeletionScoreSettings.getDeletionScoreSettings;
    const originalGetFolderSpaceData = folderSpaceService.folderSpaceService.getFolderSpaceData;

    singleEmbySettingsService.singleEmbySettingsService.getEnabled = mockGetEnabled;
    EmbyService.EmbyService.listLibraryItems = mockListLibraryItems;
    sonarrApiClient.sonarrApiClient.getSeries = mock(() => Promise.resolve([]));
    radarrApiClient.radarrApiClient.getMovies = mock(() => Promise.resolve([]));
    sonarrSettingsService.sonarrSettingsService.getEnabled = mock(() => Promise.resolve([]));
    radarrSettingsService.radarrSettingsService.getEnabled = mock(() => Promise.resolve([]));
    getDatePreference.getDatePreference = mock(() => Promise.resolve('arr'));
    getDeletionScoreSettings.getDeletionScoreSettings = mock(() =>
      Promise.resolve({
        enabled: false,
        daysUnwatchedEnabled: false,
        daysUnwatchedMaxPoints: 0,
        daysUnwatchedBreakpoints: [],
        neverWatchedEnabled: false,
        neverWatchedPoints: 0,
        sizeOnDiskEnabled: false,
        sizeOnDiskMaxPoints: 0,
        sizeOnDiskBreakpoints: [],
        ageSinceAddedEnabled: false,
        ageSinceAddedMaxPoints: 0,
        ageSinceAddedBreakpoints: [],
        folderSpaceEnabled: false,
        folderSpaceMaxPoints: 0,
        folderSpaceBreakpoints: [],
      })
    );
    folderSpaceService.folderSpaceService.getFolderSpaceData = mock(() => Promise.resolve([]));

    const processor = new MediaProcessor();
    const result = await processor.processAllMedia();

    expect(result.length).toBe(1);
    expect(result[0]?.embyId).toBe('2');

    singleEmbySettingsService.singleEmbySettingsService.getEnabled = originalGetEnabled;
    EmbyService.EmbyService.listLibraryItems = originalListLibraryItems;
    sonarrApiClient.sonarrApiClient.getSeries = originalGetSeries;
    radarrApiClient.radarrApiClient.getMovies = originalGetMovies;
    sonarrSettingsService.sonarrSettingsService.getEnabled = originalGetEnabledSonarr;
    radarrSettingsService.radarrSettingsService.getEnabled = originalGetEnabledRadarr;
    getDatePreference.getDatePreference = originalGetDatePreference;
    getDeletionScoreSettings.getDeletionScoreSettings = originalGetDeletionScoreSettings;
    folderSpaceService.folderSpaceService.getFolderSpaceData = originalGetFolderSpaceData;
  });

  test('should handle processing errors gracefully', async () => {
    const mockEmbyInstance = {
      name: 'Test Emby',
      url: 'http://localhost:8096',
      apiKey: 'test-key',
      enabled: true,
      selectedLibraries: [],
    };

    const mockEmbyItems: Emby.BaseItem[] = [
      {
        Id: '1',
        Name: 'Test Movie',
        Type: 'Movie',
        DateCreated: '2023-01-01T00:00:00Z',
      } as Emby.BaseItem,
    ];

    const mockGetEnabled = mock(() => Promise.resolve(mockEmbyInstance));
    const mockListLibraryItems = mock(() => Promise.resolve(mockEmbyItems));
    const mockGetAggregatedPlaybackInfo = mock(() => {
      throw new Error('Playback fetch failed');
    });

    const singleEmbySettingsService = await import('@/lib/utils/single-emby-settings');
    const EmbyService = await import('@/lib/services/emby-service');
    const sonarrApiClient = await import('@/lib/services/sonarr-service');
    const radarrApiClient = await import('@/lib/services/radarr-service');
    const sonarrSettingsService = await import('@/lib/database');
    const radarrSettingsService = await import('@/lib/database');
    const getDatePreference = await import('@/lib/actions/settings/app-settings');
    const getDeletionScoreSettings = await import('@/lib/actions/settings');
    const folderSpaceService = await import('@/lib/services/folder-space-service');

    const originalGetEnabled = singleEmbySettingsService.singleEmbySettingsService.getEnabled;
    const originalListLibraryItems = EmbyService.EmbyService.listLibraryItems;
    const originalGetAggregatedPlaybackInfo = EmbyService.EmbyService.getAggregatedPlaybackInfo;
    const originalGetSeries = sonarrApiClient.sonarrApiClient.getSeries;
    const originalGetMovies = radarrApiClient.radarrApiClient.getMovies;
    const originalGetEnabledSonarr = sonarrSettingsService.sonarrSettingsService.getEnabled;
    const originalGetEnabledRadarr = radarrSettingsService.radarrSettingsService.getEnabled;
    const originalGetDatePreference = getDatePreference.getDatePreference;
    const originalGetDeletionScoreSettings = getDeletionScoreSettings.getDeletionScoreSettings;
    const originalGetFolderSpaceData = folderSpaceService.folderSpaceService.getFolderSpaceData;

    singleEmbySettingsService.singleEmbySettingsService.getEnabled = mockGetEnabled;
    EmbyService.EmbyService.listLibraryItems = mockListLibraryItems;
    EmbyService.EmbyService.getAggregatedPlaybackInfo = mockGetAggregatedPlaybackInfo;
    sonarrApiClient.sonarrApiClient.getSeries = mock(() => Promise.resolve([]));
    radarrApiClient.radarrApiClient.getMovies = mock(() => Promise.resolve([]));
    sonarrSettingsService.sonarrSettingsService.getEnabled = mock(() => Promise.resolve([]));
    radarrSettingsService.radarrSettingsService.getEnabled = mock(() => Promise.resolve([]));
    getDatePreference.getDatePreference = mock(() => Promise.resolve('arr'));
    getDeletionScoreSettings.getDeletionScoreSettings = mock(() =>
      Promise.resolve({
        enabled: false,
        daysUnwatchedEnabled: false,
        daysUnwatchedMaxPoints: 0,
        daysUnwatchedBreakpoints: [],
        neverWatchedEnabled: false,
        neverWatchedPoints: 0,
        sizeOnDiskEnabled: false,
        sizeOnDiskMaxPoints: 0,
        sizeOnDiskBreakpoints: [],
        ageSinceAddedEnabled: false,
        ageSinceAddedMaxPoints: 0,
        ageSinceAddedBreakpoints: [],
        folderSpaceEnabled: false,
        folderSpaceMaxPoints: 0,
        folderSpaceBreakpoints: [],
      })
    );
    folderSpaceService.folderSpaceService.getFolderSpaceData = mock(() => Promise.resolve([]));

    const processor = new MediaProcessor();
    const result = await processor.processAllMedia();

    expect(result.length).toBe(1);
    expect(result[0]?.embyId).toBe('1');

    singleEmbySettingsService.singleEmbySettingsService.getEnabled = originalGetEnabled;
    EmbyService.EmbyService.listLibraryItems = originalListLibraryItems;
    EmbyService.EmbyService.getAggregatedPlaybackInfo = originalGetAggregatedPlaybackInfo;
    sonarrApiClient.sonarrApiClient.getSeries = originalGetSeries;
    radarrApiClient.radarrApiClient.getMovies = originalGetMovies;
    sonarrSettingsService.sonarrSettingsService.getEnabled = originalGetEnabledSonarr;
    radarrSettingsService.radarrSettingsService.getEnabled = originalGetEnabledRadarr;
    getDatePreference.getDatePreference = originalGetDatePreference;
    getDeletionScoreSettings.getDeletionScoreSettings = originalGetDeletionScoreSettings;
    folderSpaceService.folderSpaceService.getFolderSpaceData = originalGetFolderSpaceData;
  });
});
