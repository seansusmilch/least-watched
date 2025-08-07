import path from 'path';
import {
  type SonarrInstance,
  type SonarrSeries,
  type ProcessedMediaItem,
} from './types';
import { type EnhancedProcessingSettings } from '@/lib/actions/settings';
import { EmbyProcessor } from './emby-processor';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';
import { sonarrApiClient } from '@/lib/services/arr-client';

export class SonarrProcessor {
  static async processSingleItem(
    series: SonarrSeries,
    sonarrInstance: SonarrInstance,
    embyInstance: EmbySettings | null,
    enhancedSettings: EnhancedProcessingSettings
  ): Promise<ProcessedMediaItem> {
    console.log(`📺 Processing series:`);
    console.log(`   Title: ${series.title || 'Unknown'}`);
    console.log(`   ID: ${series.id || 'Unknown'}`);
    console.log(`   Year: ${series.year || 'Unknown'}`);
    console.log(`   Path: ${series.path || 'Unknown'}`);
    console.log(`   Size on Disk: ${series.statistics?.sizeOnDisk || 0} bytes`);
    console.log(`   Added: ${series.added || 'Unknown'}`);
    console.log(`   TMDB ID: ${series.tmdbId || 'Unknown'}`);
    console.log(`   IMDB ID: ${series.imdbId || 'Unknown'}`);

    // Calculate completion percentage
    const episodesOnDisk = series.statistics?.episodeFileCount || 0;
    const totalEpisodes = series.statistics?.totalEpisodeCount || 0;
    const completionPercentage =
      totalEpisodes > 0
        ? Math.round((episodesOnDisk / totalEpisodes) * 100)
        : 0;

    const processedItem: ProcessedMediaItem = {
      title: series.title || 'Unknown',
      type: 'tv',
      tmdbId: series.tmdbId ?? undefined,
      imdbId: series.imdbId ?? undefined,
      year: series.year,
      mediaPath: series.path || '',
      parentFolder: series.path ? path.dirname(series.path) : '',
      sizeOnDisk: series.statistics?.sizeOnDisk || 0,
      dateAdded: series.added ? new Date(series.added) : new Date(),
      source: sonarrInstance.name,
      sonarrId: series.id,

      // Enhanced TV show fields
      episodesOnDisk,
      totalEpisodes,
      seasonCount: series.statistics?.seasonCount || 0,
      completionPercentage,
      monitored: series.monitored !== undefined ? series.monitored : undefined,
    };

    // Get enhanced details if enabled
    if (enhancedSettings?.enableDetailedMetadata) {
      try {
        const details = await sonarrApiClient.getSeriesById(
          sonarrInstance,
          series.id || 0
        );

        if (details) {
          processedItem.runtime = details.runtime || undefined;
          processedItem.genres = details.genres || undefined;
          processedItem.overview = details.overview || undefined;

          // Extract ratings
          if (details.ratings) {
            processedItem.imdbRating = details.ratings?.value || undefined;
            processedItem.tmdbRating = details.ratings?.value || undefined;
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
        title: series.title || '',
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
