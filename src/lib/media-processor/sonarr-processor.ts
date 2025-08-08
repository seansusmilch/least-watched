import path from 'path';
import {
  type SonarrInstance,
  type SonarrSeries,
  type ProcessedMediaItem,
} from './types';
import { EmbyService } from '@/lib/services/emby-service';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';
import { sonarrApiClient } from '@/lib/services/sonarr-service';

export class SonarrProcessor {
  static async processSingleItem(
    series: SonarrSeries,
    sonarrInstance: SonarrInstance,
    embyInstance: EmbySettings | null
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
    console.log(`   TVDB ID: ${series.tvdbId || 'Unknown'}`);

    // Calculate completion percentage
    const episodesOnDisk = series.statistics?.episodeFileCount || 0;
    const totalEpisodes = series.statistics?.totalEpisodeCount || 0;
    const completionPercentage =
      totalEpisodes > 0
        ? Math.round((episodesOnDisk / totalEpisodes) * 100)
        : 0;

    // Emby-first: resolve Emby mapping up front; skip if not resolvable
    console.log(`   🎬 Querying Emby for playback info (ID-first)...`);
    const embyData = await EmbyService.getEmbyMediaDataEnhanced({
      title: series.title || '',
      type: 'tv',
      tvdbId: series.tvdbId ?? undefined,
      tmdbId: series.tmdbId ?? undefined,
      imdbId: series.imdbId ?? undefined,
      embyInstance,
    });
    if (!embyData?.embyId) {
      throw new Error(
        `No Emby mapping found for series: ${series.title || series.id}`
      );
    }

    const processedItem: ProcessedMediaItem = {
      title: series.title || 'Unknown',
      type: 'tv',
      tmdbId: series.tmdbId ?? undefined,
      imdbId: series.imdbId ?? undefined,
      tvdbId: series.tvdbId ?? undefined,
      year: series.year,
      mediaPath: series.path || '',
      parentFolder: series.path ? path.dirname(series.path) : '',
      sizeOnDisk: series.statistics?.sizeOnDisk || 0,
      dateAddedArr: series.added ? new Date(series.added) : new Date(),
      source: sonarrInstance.name,
      sonarrId: series.id,
      embyId: embyData.embyId,

      // Enhanced TV show fields
      episodesOnDisk,
      totalEpisodes,
      seasonCount: series.statistics?.seasonCount || 0,
      completionPercentage,
      monitored: series.monitored !== undefined ? series.monitored : undefined,
      lastWatched: embyData.lastWatched,
      watchCount: embyData.watchCount || 0,
    };

    if (embyData.metadata?.DateCreated) {
      console.log(`   🎬 Emby date added: ${embyData.metadata.DateCreated}`);
      processedItem.dateAddedEmby = new Date(embyData.metadata.DateCreated);
    }

    try {
      const details = await sonarrApiClient.getSeriesById(
        sonarrInstance,
        series.id || 0
      );

      if (details) {
        processedItem.runtime = details.runtime || undefined;
        processedItem.genres = details.genres || undefined;
        processedItem.overview = details.overview || undefined;

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

    if (processedItem.runtime && processedItem.episodesOnDisk) {
      const totalRuntime = processedItem.runtime * processedItem.episodesOnDisk;
      const sizeInGB = processedItem.sizeOnDisk / (1024 * 1024 * 1024);
      processedItem.sizePerHour =
        totalRuntime > 0 ? (sizeInGB / totalRuntime) * 60 : 0;
    }

    console.log(
      `   ✅ Processed item:`,
      JSON.stringify(processedItem, null, 2)
    );

    return processedItem;
  }
}
