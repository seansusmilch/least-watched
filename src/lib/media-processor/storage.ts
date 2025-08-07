import { PrismaClient, Prisma } from '../../generated/prisma';
import { type ProcessedMediaItem } from './types';
import { type DeletionScoreSettings } from '../actions/settings/types';
import { type FolderSpaceData } from '../types/media-processing';
import { deletionScoreCalculator } from '../deletion-score-calculator';
import { calculateFolderRemainingSpacePercent } from './constants';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';

const prisma = new PrismaClient();

export class MediaStorage {
  static async storeProcessedItem(
    item: ProcessedMediaItem,
    deletionScoreSettings: DeletionScoreSettings,
    folderSpaceData: FolderSpaceData[],
    embyInstance: EmbySettings | null = null
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
              preferEmbyDateAdded: embyInstance?.preferEmbyDateAdded || false,
              lastWatched: item.lastWatched,
              folderRemainingSpacePercent,
            },
            deletionScoreSettings
          )
        : null;

      const itemData = {
        title: item.title,
        type: item.type,
        tmdbId: item.tmdbId,
        imdbId: item.imdbId,
        year: item.year,
        mediaPath: item.mediaPath,
        parentFolder: item.parentFolder,
        sizeOnDisk: sizeOnDisk,
        dateAddedEmby: item.dateAddedEmby,
        dateAddedArr: item.dateAddedArr,
        source: item.source,
        embyId: item.embyId,
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
        deletionScore:
          deletionScore === null || isNaN(deletionScore as number)
            ? undefined
            : deletionScore,
      };

      // Note: For true upsert efficiency, we would need unique constraints in the schema
      // For now, we'll use a hybrid approach with findFirst + upsert

      // Create a deterministic composite key for finding existing items
      const findConditions = [];

      if (item.sonarrId) {
        findConditions.push({
          sonarrId: item.sonarrId,
          source: item.source,
        });
      }

      if (item.radarrId) {
        findConditions.push({
          radarrId: item.radarrId,
          source: item.source,
        });
      }

      // Fallback to title and type if no specific IDs
      if (findConditions.length === 0) {
        findConditions.push({
          title: item.title,
          type: item.type,
          source: item.source,
        });
      }

      // Try to find existing item
      const existingItem = await prisma.mediaItem.findFirst({
        where: {
          OR: findConditions,
        },
      });

      const result = await prisma.mediaItem.upsert({
        where: {
          id: existingItem?.id || 'nonexistent-id', // Use existing ID or dummy ID for create
        },
        update: itemData,
        create: {
          ...itemData,
          sonarrId: item.sonarrId,
          radarrId: item.radarrId,
          deletionScore:
            deletionScore === null || isNaN(deletionScore as number)
              ? 0
              : deletionScore,
        },
      });

      console.log(
        `✅ ${existingItem ? 'Updated' : 'Created'} item: ${item.title} (ID: ${
          result.id
        })`
      );
    } catch (error) {
      console.error(`❌ Error storing item ${item.title}:`, error);
      console.error(`   Item data:`, JSON.stringify(item, null, 2));
    }
  }
}
