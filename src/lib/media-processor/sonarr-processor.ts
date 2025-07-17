import path from 'path';
import {
  type SonarrInstance,
  type SonarrSeries,
  type EmbyInstance,
  type ProcessedMediaItem,
} from './types';
import { type EnhancedProcessingSettings } from '../actions/settings';
import { TESTING_LIMIT } from './constants';
import { EmbyProcessor } from './emby-processor';

export class SonarrProcessor {
  static async processInstance(
    sonarrInstance: SonarrInstance,
    embyInstances: EmbyInstance[],
    enhancedSettings: EnhancedProcessingSettings
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];

    try {
      console.log(
        `🔍 Fetching series from Sonarr instance: ${sonarrInstance.name}`
      );
      console.log(`📡 API URL: ${sonarrInstance.url}/api/v3/series`);

      // Get series from Sonarr
      const response = await fetch(`${sonarrInstance.url}/api/v3/series`, {
        headers: {
          'X-Api-Key': sonarrInstance.apiKey,
        },
      });

      if (!response.ok) {
        console.error(
          `❌ Sonarr API request failed: ${response.status} ${response.statusText}`
        );
        throw new Error(`Failed to fetch from Sonarr: ${response.statusText}`);
      }

      const series: SonarrSeries[] = await response.json();
      console.log(
        `📊 Received ${series.length} series from Sonarr ${sonarrInstance.name}`
      );

      // Limit to first entries for testing
      const limitedSeries = series.slice(0, TESTING_LIMIT);
      console.log(
        `🔢 Processing first ${limitedSeries.length} series for testing`
      );

      for (let i = 0; i < limitedSeries.length; i++) {
        const series = limitedSeries[i];

        console.log(`\n📺 Processing series ${i + 1}/${limitedSeries.length}:`);
        console.log(`   Title: ${series.title}`);
        console.log(`   ID: ${series.id}`);
        console.log(`   Year: ${series.year}`);
        console.log(`   Path: ${series.path}`);
        console.log(`   Size on Disk: ${series.statistics.sizeOnDisk} bytes`);
        console.log(`   Added: ${series.added}`);
        console.log(`   TMDB ID: ${series.tmdbId}`);
        console.log(`   IMDB ID: ${series.imdbId}`);

        // Calculate completion percentage
        const episodesOnDisk = series.statistics.episodeFileCount;
        const totalEpisodes = series.statistics.totalEpisodeCount;
        const completionPercentage =
          totalEpisodes > 0
            ? Math.round((episodesOnDisk / totalEpisodes) * 100)
            : 0;

        const processedItem: ProcessedMediaItem = {
          title: series.title,
          type: 'tv',
          tmdbId: series.tmdbId,
          imdbId: series.imdbId,
          year: series.year,
          mediaPath: series.path,
          parentFolder: path.dirname(series.path),
          sizeOnDisk: series.statistics.sizeOnDisk,
          dateAdded: new Date(series.added),
          source: sonarrInstance.name,
          sonarrId: series.id,

          // Enhanced TV show fields
          episodesOnDisk,
          totalEpisodes,
          seasonCount: series.statistics.seasonCount,
          completionPercentage,
          monitored:
            series.monitored !== undefined ? series.monitored : undefined,
        };

        // Get enhanced details if enabled
        if (enhancedSettings?.enableDetailedMetadata) {
          try {
            const detailResponse = await fetch(
              `${sonarrInstance.url}/api/v3/series/${series.id}`,
              {
                headers: { 'X-Api-Key': sonarrInstance.apiKey },
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
                `   ✅ Enhanced metadata retrieved for: ${series.title}`
              );
            }
          } catch {
            console.log(
              `   ⚠️ Could not fetch enhanced details for: ${series.title}`
            );
          }
        }

        // Calculate size efficiency
        if (processedItem.runtime && processedItem.episodesOnDisk) {
          const totalRuntime =
            processedItem.runtime * processedItem.episodesOnDisk;
          const sizeInGB = processedItem.sizeOnDisk / (1024 * 1024 * 1024);
          processedItem.sizePerHour =
            totalRuntime > 0 ? (sizeInGB / totalRuntime) * 60 : 0;
        }

        // Try to get playback information from Emby
        if (enhancedSettings?.enablePlaybackProgress) {
          console.log(`   🎬 Querying Emby for playback info...`);
          const embyData = await EmbyProcessor.getEmbyMediaData({
            title: series.title,
            embyInstances,
          });
          if (embyData) {
            processedItem.embyId = embyData.embyId;
            processedItem.lastWatched = embyData.lastWatched;
            processedItem.watchCount = embyData.watchCount || 0;
          } else {
            console.log(`   ❌ No Emby data found for: ${series.title}`);
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
        `❌ Error processing Sonarr instance ${sonarrInstance.name}:`,
        error
      );
    }

    console.log(
      `🎯 Completed processing ${processedItems.length} items from Sonarr ${sonarrInstance.name}`
    );
    return processedItems;
  }
}
