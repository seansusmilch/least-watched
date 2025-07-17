import path from 'path';
import {
  type RadarrInstance,
  type RadarrMovie,
  type EmbyInstance,
  type ProcessedMediaItem,
} from './types';
import { type EnhancedProcessingSettings } from '../actions/settings';
import { getQualityScore } from './constants';
import { EmbyProcessor } from './emby-processor';

export class RadarrProcessor {
  static async processSingleItem(
    movie: RadarrMovie,
    radarrInstance: RadarrInstance,
    embyInstances: EmbyInstance[],
    enhancedSettings: EnhancedProcessingSettings
  ): Promise<ProcessedMediaItem> {
    console.log(`🎬 Processing movie:`);
    console.log(`   Title: ${movie.title}`);
    console.log(`   ID: ${movie.id}`);
    console.log(`   Year: ${movie.year}`);
    console.log(`   Path: ${movie.path}`);
    console.log(`   Size on Disk: ${movie.sizeOnDisk} bytes`);
    console.log(`   Added: ${movie.added}`);
    console.log(`   TMDB ID: ${movie.tmdbId}`);
    console.log(`   IMDB ID: ${movie.imdbId}`);

    const processedItem: ProcessedMediaItem = {
      title: movie.title,
      type: 'movie',
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      year: movie.year,
      mediaPath: movie.path,
      parentFolder: path.dirname(movie.path),
      sizeOnDisk: movie.sizeOnDisk,
      dateAdded: new Date(movie.added),
      source: radarrInstance.name,
      radarrId: movie.id,

      // Enhanced movie fields
      quality: movie.movieFile?.quality?.quality?.name,
      monitored: movie.monitored,
    };

    // Set quality score
    if (enhancedSettings?.enableQualityAnalysis) {
      processedItem.qualityScore = getQualityScore(processedItem.quality);
    }

    // Get enhanced details if enabled
    if (enhancedSettings?.enableDetailedMetadata) {
      try {
        const detailResponse = await fetch(
          `${radarrInstance.url}/api/v3/movie/${movie.id}`,
          {
            headers: { 'X-Api-Key': radarrInstance.apiKey },
          }
        );

        if (detailResponse.ok) {
          const details = await detailResponse.json();
          processedItem.runtime = details.runtime;
          processedItem.genres = details.genres;
          processedItem.overview = details.overview;

          // Extract ratings
          if (details.ratings) {
            processedItem.imdbRating = details.ratings.imdb?.value;
            processedItem.tmdbRating = details.ratings.tmdb?.value;
          }

          console.log(`   ✅ Enhanced metadata retrieved for: ${movie.title}`);
        }
      } catch {
        console.log(
          `   ⚠️ Could not fetch enhanced details for: ${movie.title}`
        );
      }
    }

    // Calculate size efficiency
    if (processedItem.runtime) {
      const sizeInGB = processedItem.sizeOnDisk / (1024 * 1024 * 1024);
      processedItem.sizePerHour = (sizeInGB / processedItem.runtime) * 60;
    }

    // Try to get playback information from Emby
    if (enhancedSettings?.enablePlaybackProgress) {
      console.log(`   🎬 Querying Emby for playback info...`);
      const embyData = await EmbyProcessor.getEmbyMediaData({
        title: movie.title,
        embyInstances,
      });
      if (embyData) {
        processedItem.embyId = embyData.embyId;
        processedItem.lastWatched = embyData.lastWatched;
        processedItem.watchCount = embyData.watchCount || 0;
      } else {
        console.log(`   ❌ No Emby data found for: ${movie.title}`);
      }
    }

    console.log(
      `   ✅ Processed item:`,
      JSON.stringify(processedItem, null, 2)
    );

    return processedItem;
  }
}
