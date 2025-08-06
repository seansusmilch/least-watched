import path from 'path';
import {
  type RadarrInstance,
  type RadarrMovie,
  type ProcessedMediaItem,
} from '@/lib/media-processor/types';
import { type EnhancedProcessingSettings } from '@/lib/actions/settings';
import { getQualityScore } from '@/lib/media-processor/constants';
import { EmbyProcessor } from '@/lib/media-processor/emby-processor';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';
import { client as radarrClientRaw } from '@/generated/radarr/client.gen';
import { getApiV3MovieById } from '@/generated/radarr/sdk.gen';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export class RadarrProcessor {
  static async processSingleItem(
    movie: RadarrMovie,
    radarrInstance: RadarrInstance,
    embyInstance: EmbySettings | null,
    enhancedSettings: EnhancedProcessingSettings
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

    const processedItem: ProcessedMediaItem = {
      title: movie.title || 'Unknown',
      type: 'movie',
      tmdbId: movie.tmdbId ?? undefined,
      imdbId: movie.imdbId ?? undefined,
      year: movie.year,
      mediaPath: movie.path || '',
      parentFolder: movie.path ? path.dirname(movie.path) : '',
      sizeOnDisk: movie.sizeOnDisk || 0,
      dateAdded: movie.added ? new Date(movie.added) : new Date(),
      source: radarrInstance.name,
      radarrId: movie.id,

      // Enhanced movie fields
      quality: movie.movieFile?.quality?.quality?.name ?? undefined,
      monitored: movie.monitored,
    };

    // Set quality score
    if (enhancedSettings?.enableQualityAnalysis) {
      processedItem.qualityScore = getQualityScore(processedItem.quality);
    }

    // Get enhanced details if enabled
    if (enhancedSettings?.enableDetailedMetadata) {
      try {
        radarrClientRaw.setConfig({
          baseUrl: radarrInstance.url,
          headers: { 'X-Api-Key': radarrInstance.apiKey },
          fetch: (input: RequestInfo | URL, init?: RequestInit) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(
              () => controller.abort(),
              DEFAULT_TIMEOUT
            );
            return fetch(input, { ...init, signal: controller.signal }).finally(
              () => clearTimeout(timeoutId)
            );
          },
        });

        const detailsResult = await getApiV3MovieById({
          client: radarrClientRaw,
          path: { id: movie.id || 0 }, // Ensure ID is not undefined
        });

        if (detailsResult.data) {
          const details = detailsResult.data;
          processedItem.runtime = details.runtime ?? undefined;
          processedItem.genres = details.genres ?? [];
          processedItem.overview = details.overview ?? undefined;

          // Extract ratings
          if (details.ratings) {
            processedItem.imdbRating = details.ratings.imdb?.value ?? undefined;
            processedItem.tmdbRating = details.ratings.tmdb?.value ?? undefined;
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
    if (processedItem.runtime && processedItem.sizeOnDisk) {
      const sizeInGB = processedItem.sizeOnDisk / (1024 * 1024 * 1024);
      processedItem.sizePerHour = (sizeInGB / processedItem.runtime) * 60;
    }

    // Try to get playback information from Emby
    if (enhancedSettings?.enablePlaybackProgress) {
      console.log(`   🎬 Querying Emby for playback info...`);
      const embyData = await EmbyProcessor.getEmbyMediaData({
        title: movie.title || '',
        embyInstance,
      });
      if (embyData) {
        processedItem.embyId = embyData.embyId;
        processedItem.lastWatched = embyData.lastWatched;
        processedItem.watchCount = embyData.watchCount || 0;

        const preferDateAdded = embyInstance?.preferEmbyDateAdded;
        if (preferDateAdded && embyData.metadata?.DateCreated) {
          console.log(
            `   🎬 Emby date added: ${embyData.metadata.DateCreated}`
          );
          processedItem.dateAdded = new Date(embyData.metadata.DateCreated);
        }
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
