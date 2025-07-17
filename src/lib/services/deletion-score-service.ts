import { PrismaClient } from '../../generated/prisma';
import { deletionScoreCalculator } from '../deletion-score-calculator';
import { getDeletionScoreSettings } from '../actions/settings';
import { folderSpaceService } from './folder-space-service';
import { type FolderSpaceData } from '../types/media-processing';

const prisma = new PrismaClient();

export class DeletionScoreService {
  private readonly BATCH_SIZE = 100;
  private isRecalculating = false;
  private recalculationProgress = {
    totalItems: 0,
    processedItems: 0,
    updatedItems: 0,
    currentBatch: 0,
    totalBatches: 0,
  };

  /**
   * Get current recalculation progress
   */
  getRecalculationProgress() {
    return {
      isRecalculating: this.isRecalculating,
      ...this.recalculationProgress,
      percentage:
        this.recalculationProgress.totalItems > 0
          ? Math.round(
              (this.recalculationProgress.processedItems /
                this.recalculationProgress.totalItems) *
                100
            )
          : 0,
    };
  }

  /**
   * Recalculate deletion scores for all media items in the database
   */
  async recalculateAllDeletionScores(): Promise<{
    success: boolean;
    totalProcessed: number;
    totalUpdated: number;
    error?: string;
  }> {
    // Prevent concurrent recalculations
    if (this.isRecalculating) {
      return {
        success: false,
        totalProcessed: 0,
        totalUpdated: 0,
        error: 'Recalculation already in progress',
      };
    }

    this.isRecalculating = true;

    try {
      console.log('🔄 Starting deletion score recalculation...');

      // Get current settings and folder space data
      const [deletionScoreSettings, folderSpaceData] = await Promise.all([
        getDeletionScoreSettings(),
        folderSpaceService.getFolderSpaceData(),
      ]);

      if (!deletionScoreSettings.enabled) {
        console.log('❌ Deletion scoring is disabled, skipping recalculation');
        return {
          success: true,
          totalProcessed: 0,
          totalUpdated: 0,
        };
      }

      // Get total count for progress tracking
      const totalItems = await prisma.mediaItem.count();
      console.log(`📊 Found ${totalItems} items to process`);

      // Initialize progress tracking
      this.recalculationProgress = {
        totalItems,
        processedItems: 0,
        updatedItems: 0,
        currentBatch: 0,
        totalBatches: Math.ceil(totalItems / this.BATCH_SIZE),
      };

      let totalProcessed = 0;
      let totalUpdated = 0;
      let offset = 0;

      // Process items in batches
      while (offset < totalItems) {
        const items = await prisma.mediaItem.findMany({
          skip: offset,
          take: this.BATCH_SIZE,
          select: {
            id: true,
            sizeOnDisk: true,
            dateAdded: true,
            lastWatched: true,
            parentFolder: true,
            deletionScore: true,
          },
        });

        if (items.length === 0) break;

        const updates = [];

        for (const item of items) {
          const folderRemainingSpacePercent =
            this.calculateFolderRemainingSpacePercent(
              item.parentFolder,
              folderSpaceData
            );

          const newScore = deletionScoreCalculator.calculateScore(
            {
              id: item.id,
              sizeOnDisk: item.sizeOnDisk,
              dateAdded: item.dateAdded,
              lastWatched: item.lastWatched,
              folderRemainingSpacePercent,
            },
            deletionScoreSettings
          );

          // Only update if score has changed
          if (Math.abs((item.deletionScore || 0) - newScore) > 0.01) {
            updates.push({
              id: item.id,
              deletionScore: newScore,
            });
          }

          totalProcessed++;
        }

        // Batch update items that need score changes
        if (updates.length > 0) {
          try {
            // Use transaction for batch updates to ensure consistency
            await prisma.$transaction(
              updates.map((update) =>
                prisma.mediaItem.update({
                  where: { id: update.id },
                  data: { deletionScore: update.deletionScore },
                })
              )
            );
            totalUpdated += updates.length;
          } catch (error) {
            console.error(
              `❌ Error updating batch of ${updates.length} items:`,
              error
            );
            // Continue processing other batches even if one fails
          }
        }

        offset += this.BATCH_SIZE;

        // Update progress tracking
        this.recalculationProgress.processedItems = totalProcessed;
        this.recalculationProgress.updatedItems = totalUpdated;
        this.recalculationProgress.currentBatch = Math.floor(
          offset / this.BATCH_SIZE
        );

        // Log progress
        const progress = Math.round((offset / totalItems) * 100);
        console.log(
          `📈 Progress: ${progress}% (${offset}/${totalItems} items processed, ${totalUpdated} updated)`
        );
      }

      console.log(
        `✅ Deletion score recalculation completed: ${totalProcessed} processed, ${totalUpdated} updated`
      );

      return {
        success: true,
        totalProcessed,
        totalUpdated,
      };
    } catch (error) {
      console.error('❌ Error during deletion score recalculation:', error);
      return {
        success: false,
        totalProcessed: 0,
        totalUpdated: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      // Reset recalculation state
      this.isRecalculating = false;
      this.recalculationProgress = {
        totalItems: 0,
        processedItems: 0,
        updatedItems: 0,
        currentBatch: 0,
        totalBatches: 0,
      };
    }
  }

  /**
   * Calculate folder remaining space percentage for a given parent folder
   */
  private calculateFolderRemainingSpacePercent(
    parentFolder: string | null,
    folderSpaceData: FolderSpaceData[]
  ): number | null {
    if (!parentFolder) return null;

    // Find matching folder space data
    const matchingFolder = folderSpaceData.find(
      (folder) =>
        parentFolder.startsWith(folder.path) ||
        folder.path.startsWith(parentFolder)
    );

    if (!matchingFolder || !matchingFolder.totalSpaceGB) {
      return null;
    }

    // Calculate remaining space percentage
    const remainingSpacePercent =
      (matchingFolder.freeSpaceGB / matchingFolder.totalSpaceGB) * 100;
    return Math.round(remainingSpacePercent * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Clear all deletion scores (set to null)
   */
  async clearAllDeletionScores(): Promise<{
    success: boolean;
    totalCleared: number;
    error?: string;
  }> {
    try {
      console.log('🧹 Clearing all deletion scores...');

      const result = await prisma.mediaItem.updateMany({
        data: { deletionScore: 0 },
      });

      console.log(`✅ Cleared deletion scores for ${result.count} items`);

      return {
        success: true,
        totalCleared: result.count,
      };
    } catch (error) {
      console.error('❌ Error clearing deletion scores:', error);
      return {
        success: false,
        totalCleared: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const deletionScoreService = new DeletionScoreService();
