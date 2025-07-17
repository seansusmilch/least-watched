import path from 'path';
import {
  type SonarrInstance,
  type SonarrSeries,
  type EmbyInstance,
  type ProcessedMediaItem,
} from './types';
import { type EnhancedProcessingSettings } from '../actions/settings';
import { EmbyProcessor } from './emby-processor';

export class SonarrProcessor {
  static async processSingleItem(
    series: SonarrSeries,
    sonarrInstance: SonarrInstance,
    embyInstances: EmbyInstance[],
    enhancedSettings: EnhancedProcessingSettings
  ): Promise<ProcessedMediaItem> {
    console.log(`📺 Processing series:`);
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
      monitored: series.monitored !== undefined ? series.monitored : undefined,
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

          console.log(`   ✅ Enhanced metadata retrieved for: ${series.title}`);
        }
      } catch {
        console.log(
          `   ⚠️ Could not fetch enhanced details for: ${series.title}`
        );
      }
    }

    // Calculate size efficiency
    if (processedItem.runtime && processedItem.episodesOnDisk) {
      const totalRuntime = processedItem.runtime * processedItem.episodesOnDisk;
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

        const preferDateAdded = embyInstances?.some(
          (instance) => instance.preferEmbyDateAdded
        );
        if (preferDateAdded && embyData.metadata?.dateCreated) {
          processedItem.dateAdded = new Date(embyData.metadata.dateCreated);
        }
      } else {
        console.log(`   ❌ No Emby data found for: ${series.title}`);
      }
    }

    console.log(
      `   ✅ Processed item:`,
      JSON.stringify(processedItem, null, 2)
    );

    return processedItem;
  }
}
