import { faker } from '@faker-js/faker';

// Emby API Mock Responses
export const mockEmbyResponses = {
  // Authentication response
  authentication: {
    AccessToken: 'mock-access-token-12345',
    ServerId: 'mock-server-id',
    User: {
      Id: 'mock-user-id',
      Name: 'TestUser',
      HasPassword: true,
      HasConfiguredPassword: true,
      HasConfiguredEasyPassword: false,
    },
  },

  // System info response
  systemInfo: {
    SystemUpdateLevel: 'Release',
    ServerName: 'Test Emby Server',
    Version: '4.8.10.0',
    Id: 'test-emby-server-id',
    OperatingSystem: 'Linux',
    Architecture: 'X64',
    HasPendingRestart: false,
  },

  // Media folders/libraries
  mediaFolders: {
    Items: [
      {
        Id: 'test-tv-folder-id',
        Name: 'TV Shows',
        Path: '/media/tv',
        Type: 'Folder',
        CollectionType: 'tvshows',
        LocationType: 'FileSystem',
        ChildCount: 25,
      },
      {
        Id: 'test-movies-folder-id',
        Name: 'Movies',
        Path: '/media/movies',
        Type: 'Folder',
        CollectionType: 'movies',
        LocationType: 'FileSystem',
        ChildCount: 150,
      },
    ],
    TotalRecordCount: 2,
    StartIndex: 0,
  },

  // Media items (movies)
  movies: {
    Items: Array.from({ length: 10 }, (_, i) => ({
      Id: `test-movie-${i + 1}`,
      Name: faker.lorem.words(3),
      Type: 'Movie',
      RunTimeTicks: faker.number.bigInt({
        min: 54000000000n,
        max: 180000000000n,
      }),
      ProductionYear: faker.date
        .between({ from: '1990-01-01', to: '2023-12-31' })
        .getFullYear(),
      Genres: [
        faker.helpers.arrayElement([
          'Action',
          'Comedy',
          'Drama',
          'Horror',
          'Sci-Fi',
        ]),
      ],
      CommunityRating: faker.number.float({
        min: 1,
        max: 10,
        fractionDigits: 1,
      }),
      Path: `/media/movies/${faker.lorem.words(2).replace(/\s/g, '-')}.mkv`,
      MediaSources: [
        {
          Id: `source-${i + 1}`,
          Size: faker.number.bigInt({ min: 1000000000n, max: 5000000000n }),
          Container: 'mkv',
          MediaStreams: [
            {
              Type: 'Video',
              Width: 1920,
              Height: 1080,
              Codec: 'h264',
              BitRate: faker.number.int({ min: 8000000, max: 25000000 }),
            },
            {
              Type: 'Audio',
              Codec: 'aac',
              Language: 'eng',
              BitRate: faker.number.int({ min: 128000, max: 320000 }),
            },
          ],
        },
      ],
      UserData: {
        PlayCount: faker.number.int({ min: 0, max: 10 }),
        LastPlayedDate: faker.helpers.maybe(() =>
          faker.date.recent().toISOString()
        ),
        IsFavorite: faker.datatype.boolean(),
        Played: faker.datatype.boolean(),
      },
      ParentId: 'test-movies-folder-id',
    })),
    TotalRecordCount: 10,
    StartIndex: 0,
  },

  // Media items (TV series)
  series: {
    Items: Array.from({ length: 5 }, (_, i) => ({
      Id: `test-series-${i + 1}`,
      Name: faker.lorem.words(2),
      Type: 'Series',
      ProductionYear: faker.date
        .between({ from: '2000-01-01', to: '2023-12-31' })
        .getFullYear(),
      EndDate: faker.helpers.maybe(() => faker.date.recent().toISOString()),
      Genres: [
        faker.helpers.arrayElement([
          'Drama',
          'Comedy',
          'Thriller',
          'Documentary',
        ]),
      ],
      CommunityRating: faker.number.float({
        min: 1,
        max: 10,
        fractionDigits: 1,
      }),
      Path: `/media/tv/${faker.lorem.words(2).replace(/\s/g, '-')}/`,
      ChildCount: faker.number.int({ min: 1, max: 10 }), // Number of seasons
      RecursiveItemCount: faker.number.int({ min: 10, max: 200 }), // Total episodes
      UserData: {
        PlayCount: faker.number.int({ min: 0, max: 50 }),
        LastPlayedDate: faker.helpers.maybe(() =>
          faker.date.recent().toISOString()
        ),
        IsFavorite: faker.datatype.boolean(),
        UnplayedItemCount: faker.number.int({ min: 0, max: 20 }),
      },
      ParentId: 'test-tv-folder-id',
    })),
    TotalRecordCount: 5,
    StartIndex: 0,
  },
};

// Sonarr API Mock Responses
export const mockSonarrResponses = {
  // System status
  systemStatus: {
    version: '4.0.10.2544',
    buildTime: '2024-01-15T10:30:00Z',
    isDebug: false,
    isProduction: true,
    isAdmin: true,
    isUserInteractive: false,
    startupPath: '/app/Sonarr',
    appData: '/config',
    osName: 'ubuntu',
    osVersion: '22.04',
    isMonoRuntime: false,
    isMono: false,
    isLinux: true,
    isOsx: false,
    isWindows: false,
    mode: 'console',
    branch: 'main',
    authentication: 'forms',
    sqliteVersion: '3.46.0',
    migrationVersion: 201,
    urlBase: '',
    runtimeVersion: '8.0.11',
    databaseType: 'sqlite',
    databaseVersion: '3.46.0',
    packageVersion: '',
    packageAuthor: '[Team Sonarr](https://sonarr.tv)',
    packageUpdateMechanism: 'docker',
  },

  // Root folders
  rootFolders: [
    {
      id: 1,
      path: '/media/tv',
      accessible: true,
      freeSpace: 500000000000, // 500GB
      unmappedFolders: [],
    },
  ],

  // Series data
  series: Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    title: faker.lorem.words(2),
    alternateTitles: [],
    sortTitle: faker.lorem.words(2),
    status: faker.helpers.arrayElement(['continuing', 'ended', 'upcoming']),
    ended: faker.datatype.boolean(),
    overview: faker.lorem.paragraph(),
    previousAiring: faker.helpers.maybe(() =>
      faker.date.recent().toISOString()
    ),
    nextAiring: faker.helpers.maybe(() => faker.date.future().toISOString()),
    network: faker.helpers.arrayElement([
      'HBO',
      'Netflix',
      'BBC',
      'ABC',
      'NBC',
    ]),
    airTime: '21:00',
    images: [
      {
        coverType: 'poster',
        remoteUrl: `https://artworks.thetvdb.com/banners/posters/${faker.number.int()}.jpg`,
        url: `/api/v3/mediacover/${i + 1}/poster.jpg`,
      },
    ],
    remotePoster: `https://artworks.thetvdb.com/banners/posters/${faker.number.int()}.jpg`,
    seasons: Array.from(
      { length: faker.number.int({ min: 1, max: 8 }) },
      (_, seasonIndex) => ({
        seasonNumber: seasonIndex + 1,
        monitored: true,
        statistics: {
          episodeFileCount: faker.number.int({ min: 8, max: 24 }),
          episodeCount: faker.number.int({ min: 8, max: 24 }),
          totalEpisodeCount: faker.number.int({ min: 8, max: 24 }),
          sizeOnDisk: faker.number.bigInt({
            min: 2000000000n,
            max: 20000000000n,
          }),
          percentOfEpisodes: faker.number.float({
            min: 80,
            max: 100,
            fractionDigits: 1,
          }),
        },
      })
    ),
    year: faker.date
      .between({ from: '2000-01-01', to: '2023-12-31' })
      .getFullYear(),
    path: `/media/tv/${faker.lorem.words(2).replace(/\s/g, '-')}`,
    qualityProfileId: 1,
    languageProfileId: 1,
    seasonFolder: true,
    monitored: true,
    useSceneNumbering: false,
    runtime: faker.number.int({ min: 20, max: 60 }),
    tvdbId: faker.number.int({ min: 100000, max: 999999 }),
    tvRageId: 0,
    tvMazeId: faker.number.int({ min: 1000, max: 50000 }),
    firstAired: faker.date.past().toISOString(),
    seriesType: 'standard',
    cleanTitle: faker.lorem.words(2).replace(/\s/g, '').toLowerCase(),
    imdbId: `tt${faker.number.int({ min: 1000000, max: 9999999 })}`,
    titleSlug: faker.lorem.words(2).replace(/\s/g, '-').toLowerCase(),
    certification: faker.helpers.arrayElement([
      'TV-14',
      'TV-MA',
      'TV-PG',
      'TV-G',
    ]),
    genres: [
      faker.helpers.arrayElement(['Drama', 'Comedy', 'Action', 'Thriller']),
    ],
    tags: [],
    added: faker.date.past().toISOString(),
    ratings: {
      votes: faker.number.int({ min: 100, max: 50000 }),
      value: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
    },
    statistics: {
      seasonCount: faker.number.int({ min: 1, max: 8 }),
      episodeFileCount: faker.number.int({ min: 10, max: 200 }),
      episodeCount: faker.number.int({ min: 10, max: 200 }),
      totalEpisodeCount: faker.number.int({ min: 10, max: 200 }),
      sizeOnDisk: faker.number.bigInt({ min: 5000000000n, max: 100000000000n }),
      percentOfEpisodes: faker.number.float({
        min: 75,
        max: 100,
        fractionDigits: 1,
      }),
    },
  })),
};

// Radarr API Mock Responses
export const mockRadarrResponses = {
  // System status
  systemStatus: {
    version: '5.16.3.9541',
    buildTime: '2024-01-20T14:25:00Z',
    isDebug: false,
    isProduction: true,
    isAdmin: true,
    isUserInteractive: false,
    startupPath: '/app/Radarr',
    appData: '/config',
    osName: 'ubuntu',
    osVersion: '22.04',
    isMonoRuntime: false,
    isMono: false,
    isLinux: true,
    isOsx: false,
    isWindows: false,
    mode: 'console',
    branch: 'master',
    authentication: 'forms',
    sqliteVersion: '3.46.0',
    migrationVersion: 245,
    urlBase: '',
    runtimeVersion: '8.0.11',
    databaseType: 'sqlite',
    databaseVersion: '3.46.0',
    packageVersion: '',
    packageAuthor: '[Team Radarr](https://radarr.video)',
    packageUpdateMechanism: 'docker',
  },

  // Root folders
  rootFolders: [
    {
      id: 1,
      path: '/media/movies',
      accessible: true,
      freeSpace: 1000000000000, // 1TB
      unmappedFolders: [],
    },
  ],

  // Movies data
  movies: Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: faker.lorem.words(3),
    originalTitle: faker.lorem.words(3),
    originalLanguage: {
      id: 1,
      name: 'English',
    },
    alternateTitles: [],
    secondaryYearSourceId: 0,
    sortTitle: faker.lorem.words(3),
    sizeOnDisk: faker.number.bigInt({ min: 1000000000n, max: 8000000000n }),
    status: faker.helpers.arrayElement(['released', 'inCinemas', 'announced']),
    overview: faker.lorem.paragraphs(2),
    inCinemas: faker.date
      .between({ from: '2020-01-01', to: '2024-01-01' })
      .toISOString(),
    physicalRelease: faker.date
      .between({ from: '2020-01-01', to: '2024-01-01' })
      .toISOString(),
    digitalRelease: faker.date
      .between({ from: '2020-01-01', to: '2024-01-01' })
      .toISOString(),
    images: [
      {
        coverType: 'poster',
        remoteUrl: `https://image.tmdb.org/t/p/original/${faker.string.alphanumeric(
          30
        )}.jpg`,
        url: `/api/v3/mediacover/${i + 1}/poster.jpg`,
      },
      {
        coverType: 'fanart',
        remoteUrl: `https://image.tmdb.org/t/p/original/${faker.string.alphanumeric(
          30
        )}.jpg`,
        url: `/api/v3/mediacover/${i + 1}/fanart.jpg`,
      },
    ],
    website: faker.internet.url(),
    year: faker.date
      .between({ from: '1990-01-01', to: '2024-01-01' })
      .getFullYear(),
    hasFile: faker.datatype.boolean(),
    youTubeTrailerId: faker.string.alphanumeric(11),
    studio: faker.company.name(),
    path: `/media/movies/${faker.lorem
      .words(3)
      .replace(/\s/g, '-')} (${faker.date
      .between({ from: '1990-01-01', to: '2024-01-01' })
      .getFullYear()})`,
    qualityProfileId: 1,
    monitored: true,
    minimumAvailability: 'announced',
    isAvailable: true,
    folderName: faker.lorem.words(3).replace(/\s/g, '-'),
    runtime: faker.number.int({ min: 90, max: 180 }),
    cleanTitle: faker.lorem.words(3).replace(/\s/g, '').toLowerCase(),
    imdbId: `tt${faker.number.int({ min: 1000000, max: 9999999 })}`,
    tmdbId: faker.number.int({ min: 10000, max: 999999 }),
    titleSlug: faker.lorem.words(3).replace(/\s/g, '-').toLowerCase(),
    certification: faker.helpers.arrayElement([
      'PG',
      'PG-13',
      'R',
      'NC-17',
      'G',
    ]),
    genres: [
      faker.helpers.arrayElement([
        'Action',
        'Adventure',
        'Comedy',
        'Drama',
        'Fantasy',
        'Horror',
        'Mystery',
        'Romance',
        'Thriller',
        'Western',
      ]),
    ],
    tags: [],
    added: faker.date.past().toISOString(),
    ratings: {
      imdb: {
        votes: faker.number.int({ min: 1000, max: 500000 }),
        value: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
        type: 'user',
      },
      tmdb: {
        votes: faker.number.int({ min: 100, max: 50000 }),
        value: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
        type: 'user',
      },
    },
    movieFile: faker.datatype.boolean()
      ? {
          id: faker.number.int({ min: 1, max: 1000 }),
          movieId: i + 1,
          relativePath: `${faker.lorem.words(3).replace(/\s/g, '-')}.mkv`,
          path: `/media/movies/${faker.lorem
            .words(3)
            .replace(/\s/g, '-')} (${faker.date
            .between({ from: '1990-01-01', to: '2024-01-01' })
            .getFullYear()})/${faker.lorem.words(3).replace(/\s/g, '-')}.mkv`,
          size: faker.number.bigInt({ min: 1000000000n, max: 8000000000n }),
          dateAdded: faker.date.past().toISOString(),
          sceneName: '',
          indexerFlags: 0,
          quality: {
            quality: {
              id: faker.number.int({ min: 1, max: 10 }),
              name: faker.helpers.arrayElement([
                'HDTV-720p',
                'HDTV-1080p',
                'Bluray-720p',
                'Bluray-1080p',
                'WEB-720p',
                'WEB-1080p',
              ]),
              source: faker.helpers.arrayElement([
                'television',
                'webdl',
                'bluray',
              ]),
              resolution: faker.helpers.arrayElement(['720p', '1080p', '4K']),
            },
            revision: {
              version: 1,
              real: 0,
              isRepack: false,
            },
          },
          mediaInfo: {
            containerFormat: 'Matroska',
            videoFormat: 'AVC',
            videoCodecID: 'V_MPEG4/ISO/AVC',
            videoProfile: 'High',
            videoCodecLibrary: 'x264',
            videoBitrate: faker.number.int({ min: 8000, max: 25000 }),
            videoBitDepth: 8,
            videoMultiViewCount: 0,
            videoColourPrimaries: 'BT.709',
            videoTransferCharacteristics: 'BT.709',
            width: 1920,
            height: 1080,
            audioFormat: 'AAC LC',
            audioCodecID: 'A_AAC-2',
            audioCodecLibrary: '',
            audioAdditionalFeatures: 'LC',
            audioBitrate: faker.number.int({ min: 128, max: 320 }),
            runTime: `${faker.number.int({ min: 90, max: 180 })}:00`,
            audioStreamCount: 1,
            audioChannels: 2,
            audioChannelPositions: '2/0/0',
            audioChannelPositionsText: 'Front: L R',
            audioProfile: '',
            videoFps: 23.976,
            audioLanguages: 'English',
            subtitles: 'English',
            scanType: 'Progressive',
            schemaRevision: 5,
          },
          qualityCutoffNotMet: false,
          languages: [
            {
              id: 1,
              name: 'English',
            },
          ],
        }
      : null,
  })),
};

// Error responses for testing error handling
export const mockErrorResponses = {
  unauthorized: {
    error: 'Unauthorized',
    message: 'Invalid API key',
    statusCode: 401,
  },
  notFound: {
    error: 'Not Found',
    message: 'Resource not found',
    statusCode: 404,
  },
  serverError: {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    statusCode: 500,
  },
  timeout: {
    error: 'Request Timeout',
    message: 'Request timed out',
    statusCode: 408,
  },
};

// API endpoint mappings for route interception
export const mockApiEndpoints = {
  emby: {
    '/Users/authenticate': mockEmbyResponses.authentication,
    '/System/Info': mockEmbyResponses.systemInfo,
    '/Library/VirtualFolders': mockEmbyResponses.mediaFolders,
    '/Items*': (url: string) => {
      if (url.includes('IncludeItemTypes=Movie')) {
        return mockEmbyResponses.movies;
      } else if (url.includes('IncludeItemTypes=Series')) {
        return mockEmbyResponses.series;
      }
      return { Items: [], TotalRecordCount: 0, StartIndex: 0 };
    },
  },
  sonarr: {
    '/api/v3/system/status': mockSonarrResponses.systemStatus,
    '/api/v3/rootfolder': mockSonarrResponses.rootFolders,
    '/api/v3/series': mockSonarrResponses.series,
  },
  radarr: {
    '/api/v3/system/status': mockRadarrResponses.systemStatus,
    '/api/v3/rootfolder': mockRadarrResponses.rootFolders,
    '/api/v3/movie': mockRadarrResponses.movies,
  },
};
