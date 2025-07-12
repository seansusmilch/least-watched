import { MediaProcessor } from '../media-processor';
import { deletionScoreCalculator } from '../deletion-score-calculator';
import { getDeletionScoreSettings } from '../actions/settings';
import { type MediaItemData } from '../types/media-processing';

interface StoredMediaItem {
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
  quality?: string | null;
  qualityScore?: number | null;
  episodesOnDisk?: number | null;
  totalEpisodes?: number | null;
  seasonCount?: number | null;
  completionPercentage?: number | null;
  monitored?: boolean | null;
  imdbRating?: number | null;
  tmdbRating?: number | null;
  playProgress?: number | null;
  fullyWatched?: boolean | null;
  runtime?: number | null;
  sizePerHour?: number | null;
  genres?: string | null;
  overview?: string | null;
  folderRemainingSpacePercent?: number | null;
}

export class MediaService {
  private processor: MediaProcessor;

  constructor() {
    this.processor = new MediaProcessor();
  }

  async getMediaItems(): Promise<MediaItemData[]> {
    try {
      const storedItems = await this.processor.getStoredMediaItems();
      return this.transformStoredItemsToMediaData(storedItems);
    } catch (error) {
      console.error('Error getting media items:', error);
      return [];
    }
  }

  async getMediaItemsWithScores(): Promise<MediaItemData[]> {
    try {
      const storedItems = await this.processor.getStoredMediaItems();
      const deletionScoreSettings = await getDeletionScoreSettings();

      const mediaItems = this.transformStoredItemsToMediaData(storedItems);

      // Add deletion scores
      return mediaItems.map((item) => ({
        ...item,
        deletionScore: deletionScoreCalculator.calculateScore(
          // Convert back to the format expected by deletion score calculator
          this.convertToStoredMediaItemFormat(item),
          deletionScoreSettings
        ),
      }));
    } catch (error) {
      console.error('Error getting media items with scores:', error);
      return [];
    }
  }

  private transformStoredItemsToMediaData(
    storedItems: StoredMediaItem[]
  ): MediaItemData[] {
    return storedItems.map((item) => ({
      ...item,
      year: item.year ?? undefined,
      mediaPath: item.mediaPath ?? undefined,
      sizeOnDisk: item.sizeOnDisk ?? undefined,
      dateAdded: item.dateAdded ?? undefined,
      lastWatched: item.lastWatched ?? undefined,
      source: item.source ?? undefined,
      quality: item.quality ?? undefined,
      qualityScore: item.qualityScore ?? undefined,
      episodesOnDisk: item.episodesOnDisk ?? undefined,
      totalEpisodes: item.totalEpisodes ?? undefined,
      seasonCount: item.seasonCount ?? undefined,
      completionPercentage: item.completionPercentage ?? undefined,
      monitored: item.monitored ?? undefined,
      imdbRating: item.imdbRating ?? undefined,
      tmdbRating: item.tmdbRating ?? undefined,
      playProgress: item.playProgress ?? undefined,
      fullyWatched: item.fullyWatched ?? undefined,
      runtime: item.runtime ?? undefined,
      sizePerHour: item.sizePerHour ?? undefined,
      genres: item.genres ?? undefined,
      overview: item.overview ?? undefined,
    }));
  }

  private convertToStoredMediaItemFormat(item: MediaItemData): StoredMediaItem {
    // Convert back to the format expected by deletion score calculator
    // This maintains compatibility with existing deletion score logic
    return {
      ...item,
      year: item.year ?? null,
      mediaPath: item.mediaPath ?? null,
      sizeOnDisk: item.sizeOnDisk ?? null,
      dateAdded: item.dateAdded ?? null,
      lastWatched: item.lastWatched ?? null,
      source: item.source ?? null,
      quality: item.quality ?? null,
      qualityScore: item.qualityScore ?? null,
      episodesOnDisk: item.episodesOnDisk ?? null,
      totalEpisodes: item.totalEpisodes ?? null,
      seasonCount: item.seasonCount ?? null,
      completionPercentage: item.completionPercentage ?? null,
      monitored: item.monitored ?? null,
      imdbRating: item.imdbRating ?? null,
      tmdbRating: item.tmdbRating ?? null,
      playProgress: item.playProgress ?? null,
      fullyWatched: item.fullyWatched ?? null,
      runtime: item.runtime ?? null,
      sizePerHour: item.sizePerHour ?? null,
      genres: item.genres ?? null,
      overview: item.overview ?? null,
    };
  }
}

export const mediaService = new MediaService();
