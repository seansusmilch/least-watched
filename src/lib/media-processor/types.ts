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
  tmdbId?: number | null;
  imdbId?: string | null;
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

import { MovieResource } from '../../generated/radarr/types.gen';
import { SeriesResource } from '../../generated/sonarr/types.gen';

export type SonarrSeries = SeriesResource;
export type RadarrMovie = MovieResource;

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

export interface EmbyPlaybackInfo {
  lastWatched?: Date;
  watchCount?: number;
  embyId?: string;
  metadata?: EmbyMetadata;
}

import Emby from 'emby-sdk-stainless';

export type EmbyMetadata = Emby.BaseItem;
