import path from 'path';
import {
  type RadarrInstance,
  type RadarrMovie,
  type EmbyInstance,
  type ProcessedMediaItem,
} from './types';
import { type EnhancedProcessingSettings } from '../actions/settings';
import { TESTING_LIMIT, getQualityScore } from './constants';
import { EmbyProcessor } from './emby-processor';

export class RadarrProcessor {
  static async processInstance(
    radarrInstance: RadarrInstance,
    embyInstances: EmbyInstance[],
    enhancedSettings: EnhancedProcessingSettings
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];

    try {
      console.log(
        `🔍 Fetching movies from Radarr instance: ${radarrInstance.name}`
      );
      console.log(`📡 API URL: ${radarrInstance.url}/api/v3/movie`);

      // Get movies from Radarr
      const response = await fetch(`${radarrInstance.url}/api/v3/movie`, {
        headers: {
          'X-Api-Key': radarrInstance.apiKey,
        },
      });

      if (!response.ok) {
        console.error(
          `❌ Radarr API request failed: ${response.status} ${response.statusText}`
        );
        throw new Error(`Failed to fetch from Radarr: ${response.statusText}`);
      }

      const movies: RadarrMovie[] = await response.json();
      console.log(
        `📊 Received ${movies.length} movies from Radarr ${radarrInstance.name}`
      );

      // Limit to first entries for testing
      const limitedMovies = movies.slice(0, TESTING_LIMIT);
      console.log(
        `🔢 Processing first ${limitedMovies.length} movies for testing`
      );

      for (let i = 0; i < limitedMovies.length; i++) {
        const movie = limitedMovies[i];

        console.log(`\n🎬 Processing movie ${i + 1}/${limitedMovies.length}:`);
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

              console.log(
                `   ✅ Enhanced metadata retrieved for: ${movie.title}`
              );
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
          const embyData = await EmbyProcessor.getPlaybackInfo(
            movie.title,
            embyInstances
          );
          if (embyData) {
            console.log(
              `   ✅ Found Emby data:`,
              JSON.stringify(embyData, null, 2)
            );
            processedItem.embyId = embyData.embyId;
            processedItem.lastWatched = embyData.lastWatched;
            processedItem.watchCount = embyData.watchCount || 0;
          } else {
            console.log(`   ❌ No Emby data found for: ${movie.title}`);
          }
        }

        processedItems.push(processedItem);
        console.log(
          `   ✅ Processed item:`,
          JSON.stringify(processedItem, null, 2)
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing Radarr instance ${radarrInstance.name}:`,
        error
      );
    }

    console.log(
      `🎯 Completed processing ${processedItems.length} items from Radarr ${radarrInstance.name}`
    );
    return processedItems;
  }
}
