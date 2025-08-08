import path from 'path';
import {
  type RadarrInstance,
  type RadarrMovie,
  type ProcessedMediaItem,
} from '@/lib/media-processor/types';
import { getQualityScore } from '@/lib/media-processor/constants';
import { EmbyService } from '@/lib/services/emby-service';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';
import { radarrApiClient } from '@/lib/services/radarr-service';

export class RadarrProcessor {
  static async processSingleItem(
    movie: RadarrMovie,
    radarrInstance: RadarrInstance,
    embyInstance: EmbySettings | null
  ): Promise<ProcessedMediaItem> {
    console.log(`🎬 Processing movie:`);
    console.log(`   Title: ${movie.title || 'Unknown'}`);
    console.log(`   ID: ${movie.id || 'Unknown'}`);
    console.log(`   Year: ${movie.year || 'Unknown'}`);
    console.log(`   Path: ${movie.path || 'Unknown'}`);
    console.log(`   Size on Disk: ${movie.sizeOnDisk || 0} bytes`);
    console.log(`   Added: ${movie.added || 'Unknown'}`);
    console.log(`   TMDB ID: ${movie.tmdbId || 'Unknown'}`);
    console.log(`   IMDB ID: ${movie.imdbId || 'Unknown'}`);

    // Emby-first: resolve Emby mapping up front; skip if not resolvable
    console.log(`   🎬 Querying Emby for playback info (ID-first)...`);
    const embyData = await EmbyService.getEmbyMediaDataEnhanced({
      title: movie.title || '',
      type: 'movie',
      tmdbId: movie.tmdbId ?? undefined,
      imdbId: movie.imdbId ?? undefined,
      embyInstance,
    });
    if (!embyData?.embyId) {
      throw new Error(
        `No Emby mapping found for movie: ${movie.title || movie.id}`
      );
    }

    const processedItem: ProcessedMediaItem = {
      title: movie.title || 'Unknown',
      type: 'movie',
      tmdbId: movie.tmdbId ?? undefined,
      imdbId: movie.imdbId ?? undefined,
      year: movie.year,
      mediaPath: movie.path || '',
      parentFolder: movie.path ? path.dirname(movie.path) : '',
      sizeOnDisk: movie.sizeOnDisk || 0,
      dateAddedArr: movie.added ? new Date(movie.added) : new Date(),
      source: radarrInstance.name,
      radarrId: movie.id,
      embyId: embyData.embyId,

      // Enhanced movie fields
      quality: movie.movieFile?.quality?.quality?.name ?? undefined,
      monitored: movie.monitored,
      lastWatched: embyData.lastWatched,
      watchCount: embyData.watchCount || 0,
    };

    if (embyData.metadata?.DateCreated) {
      console.log(`   🎬 Emby date added: ${embyData.metadata.DateCreated}`);
      processedItem.dateAddedEmby = new Date(embyData.metadata.DateCreated);
    }

    processedItem.qualityScore = getQualityScore(processedItem.quality);

    try {
      const details = await radarrApiClient.getMovieById(
        radarrInstance,
        movie.id || 0
      );

      if (details) {
        processedItem.runtime = details.runtime ?? undefined;
        processedItem.genres = details.genres ?? [];
        processedItem.overview = details.overview ?? undefined;

        if (details.ratings) {
          processedItem.imdbRating = details.ratings.imdb?.value ?? undefined;
          processedItem.tmdbRating = details.ratings.tmdb?.value ?? undefined;
        }

        console.log(`   ✅ Enhanced metadata retrieved for: ${movie.title}`);
      }
    } catch {
      console.log(`   ⚠️ Could not fetch enhanced details for: ${movie.title}`);
    }

    if (processedItem.runtime && processedItem.sizeOnDisk) {
      const sizeInGB = processedItem.sizeOnDisk / (1024 * 1024 * 1024);
      processedItem.sizePerHour = (sizeInGB / processedItem.runtime) * 60;
    }

    console.log(
      `   ✅ Processed item:`,
      JSON.stringify(processedItem, null, 2)
    );

    return processedItem;
  }
}
