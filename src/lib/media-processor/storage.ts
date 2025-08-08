import { PrismaClient, Prisma } from '../../generated/prisma';
import { type ProcessedMediaItem } from './types';
import { type DeletionScoreSettings } from '../actions/settings/types';
import { type FolderSpaceData } from '../types/media-processing';
import { deletionScoreCalculator } from '../deletion-score-calculator';
import { calculateFolderRemainingSpacePercent } from './constants';
import { type DatePreference } from '@/lib/types/media';

const prisma = new PrismaClient();

export class MediaStorage {
  static async storeProcessedItem(
    item: ProcessedMediaItem,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[],
    datePreference: DatePreference = 'arr'
  ): Promise<void> {
    try {
      console.log(`📦 Storing item: ${item.title}`);

      // Safely convert sizeOnDisk to BigInt
      const sizeOnDisk = item.sizeOnDisk
        ? BigInt(Math.max(0, item.sizeOnDisk))
        : null;

      // Calculate deletion score
      const folderRemainingSpacePercent = calculateFolderRemainingSpacePercent(
        item.parentFolder,
        folderSpaceData
      );

      const deletionScore = deletionScoreSettings.enabled
        ? deletionScoreCalculator.calculateScore(
            {
              id: 'temp', // No existing item for new items
              sizeOnDisk: sizeOnDisk,
              dateAddedEmby: item.dateAddedEmby,
              dateAddedArr: item.dateAddedArr,
              datePreference: datePreference,
              lastWatched: item.lastWatched,
              folderRemainingSpacePercent,
            },
            deletionScoreSettings
          )
        : -1;

      const itemData = {
        title: item.title,
        type: item.type,
        tmdbId: item.tmdbId,
        imdbId: item.imdbId,
        tvdbId: item.tvdbId,
        year: item.year,
        mediaPath: item.mediaPath,
        parentFolder: item.parentFolder,
        sizeOnDisk: sizeOnDisk,
        dateAddedEmby: item.dateAddedEmby,
        dateAddedArr: item.dateAddedArr,
        source: item.source,

        embyId: item.embyId,
        sonarrId: item.sonarrId,
        radarrId: item.radarrId,

        lastWatched: item.lastWatched,
        watchCount: item.watchCount || 0,

        // Enhanced fields
        quality: item.quality,
        qualityScore: item.qualityScore,

        // TV Show specific
        episodesOnDisk: item.episodesOnDisk,
        totalEpisodes: item.totalEpisodes,
        seasonCount: item.seasonCount,
        completionPercentage: item.completionPercentage,

        // Monitoring and availability
        monitored: item.monitored,

        // Ratings
        imdbRating: item.imdbRating,
        tmdbRating: item.tmdbRating,

        // Play progress
        playProgress: item.playProgress,
        fullyWatched: item.fullyWatched,

        // Size efficiency
        runtime: item.runtime,
        sizePerHour: item.sizePerHour,

        // Metadata
        genres: item.genres ? item.genres : Prisma.JsonNull,
        overview: item.overview,

        // Deletion score
        deletionScore: deletionScore,
      };

      let result;

      result = await prisma.mediaItem.upsert({
        where: { embyId: item.embyId },
        update: itemData,
        create: itemData,
      });

      console.log(`✅ Upserted item: ${item.title} (ID: ${result.id})`);
    } catch (error) {
      console.error(`❌ Error storing item ${item.title}:`, error);
      console.error(`   Item data:`, JSON.stringify(item, null, 2));
    }
  }
}
