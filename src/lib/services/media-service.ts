import { MediaProcessor } from '../media-processor';
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
  deletionScore?: number | null;
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
    // Now that scores are stored in the database, this method is the same as getMediaItems
    return this.getMediaItems();
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
      folderRemainingSpacePercent:
        item.folderRemainingSpacePercent ?? undefined,
      deletionScore: item.deletionScore ?? undefined,
    }));
  }
}

export const mediaService = new MediaService();
