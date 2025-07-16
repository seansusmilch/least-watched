import { MediaProcessor, type StoredMediaItem } from '../media-processor/';
import { type MediaItemData } from '../types/media-processing';

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
