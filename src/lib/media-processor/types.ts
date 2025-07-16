export interface MediaProcessingProgress {
  phase: string;
  current: number;
  total: number;
  currentItem: string;
  percentage: number;
  isComplete?: boolean;
  error?: string;
}

export interface ProcessedMediaItem {
  title: string;
  type: 'movie' | 'tv';
  tmdbId?: number;
  imdbId?: string;
  year?: number;
  mediaPath: string;
  parentFolder: string;
  sizeOnDisk: number;
  dateAdded: Date;
  source: string;
  sonarrId?: number;
  radarrId?: number;
  embyId?: string;
  lastWatched?: Date;
  watchCount?: number;

  // Enhanced fields for deletion decisions
  quality?: string;
  qualityScore?: number;

  // TV Show specific
  episodesOnDisk?: number;
  totalEpisodes?: number;
  seasonCount?: number;
  completionPercentage?: number;

  // Monitoring and availability
  monitored?: boolean;

  // Ratings
  imdbRating?: number;
  tmdbRating?: number;

  // Play progress from Emby
  playProgress?: number;
  fullyWatched?: boolean;

  // Size efficiency
  runtime?: number;
  sizePerHour?: number;

  // Metadata
  genres?: string[];
  overview?: string;
}

export interface SonarrSeries {
  id: number;
  title: string;
  year: number;
  added: string;
  path: string;
  tvdbId?: number;
  tmdbId?: number;
  imdbId?: string;
  monitored?: boolean;
  seasons?: Array<{
    statistics?: {
      episodeFileCount: number;
    };
  }>;
  statistics: {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
  };
}

export interface RadarrMovie {
  id: number;
  title: string;
  year: number;
  added: string;
  path: string;
  sizeOnDisk: number;
  tmdbId?: number;
  imdbId?: string;
  monitored?: boolean;
  movieFile?: {
    quality?: {
      quality?: {
        name: string;
      };
    };
  };
}

export interface SonarrInstance {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RadarrInstance {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmbyInstance {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  userId?: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredMediaItem {
  id: string;
  title: string;
  type: string;
  tmdbId?: number | null;
  imdbId?: string | null;
  year?: number | null;
  lastWatched?: Date | null;
  watchCount: number;
  sonarrId?: number | null;
  radarrId?: number | null;
  embyId?: string | null;
  mediaPath?: string | null;
  parentFolder?: string | null;
  sizeOnDisk?: bigint | null;
  dateAdded?: Date | null;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Enhanced fields
  quality?: string | null;
  qualityScore?: number | null;

  // TV Show specific
  episodesOnDisk?: number | null;
  totalEpisodes?: number | null;
  seasonCount?: number | null;
  completionPercentage?: number | null;

  // Monitoring and availability
  monitored?: boolean | null;

  // Ratings
  imdbRating?: number | null;
  tmdbRating?: number | null;

  // Play progress
  playProgress?: number | null;
  fullyWatched?: boolean | null;

  // Size efficiency
  runtime?: number | null;
  sizePerHour?: number | null;

  // Metadata
  genres?: string | null;
  overview?: string | null;

  // Folder space
  folderRemainingSpacePercent?: number | null;

  // Deletion score
  deletionScore?: number | null;
}

export interface EmbyPlaybackInfo {
  lastWatched?: Date;
  watchCount?: number;
  embyId?: string;
}
