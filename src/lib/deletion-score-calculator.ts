import { DeletionScoreSettings } from './actions/settings';

export interface MediaItemForScoring {
  id: string;
  sizeOnDisk?: bigint | null;
  dateAdded?: Date | null;
  lastWatched?: Date | null;
  folderRemainingSpacePercent?: number | null;
}

export class DeletionScoreCalculator {
  private cache = new Map<string, number>();
  private settingsHash: string | null = null;

  /**
   * Calculate deletion score for a single media item
   */
  calculateScore(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): number {
    if (!settings.enabled) {
      return 0;
    }

    // Check if we need to invalidate cache due to settings change
    const currentSettingsHash = this.hashSettings(settings);
    if (this.settingsHash !== currentSettingsHash) {
      this.invalidateCache();
      this.settingsHash = currentSettingsHash;
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(item, settings);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Calculate score
    const score = this.performCalculation(item, settings);

    // Cache the result
    this.cache.set(cacheKey, score);

    return score;
  }

  /**
   * Calculate deletion scores for multiple media items
   */
  calculateScoresForItems(
    items: MediaItemForScoring[],
    settings: DeletionScoreSettings
  ): Map<string, number> {
    const scores = new Map<string, number>();

    for (const item of items) {
      const score = this.calculateScore(item, settings);
      scores.set(item.id, score);
    }

    return scores;
  }

  /**
   * Invalidate the entire cache
   */
  invalidateCache(): void {
    this.cache.clear();
    this.settingsHash = null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; settingsHash: string | null } {
    return {
      size: this.cache.size,
      settingsHash: this.settingsHash,
    };
  }

  /**
   * Perform the actual deletion score calculation
   */
  private performCalculation(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): number {
    let score = 0;

    // 1. Days unwatched factor
    if (settings.daysUnwatchedEnabled) {
      const referenceDate = item.lastWatched || item.dateAdded || new Date();
      const daysSinceReference = Math.floor(
        (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceReference <= 30) {
        score += settings.daysUnwatched30Days;
      } else if (daysSinceReference <= 90) {
        score += settings.daysUnwatched90Days;
      } else if (daysSinceReference <= 180) {
        score += settings.daysUnwatched180Days;
      } else if (daysSinceReference <= 365) {
        score += settings.daysUnwatched365Days;
      } else {
        score += settings.daysUnwatchedOver365;
      }
    }

    // 2. Never watched bonus
    if (settings.neverWatchedEnabled && !item.lastWatched) {
      score += settings.neverWatchedPoints;
    }

    // 3. Size on disk factor
    if (settings.sizeOnDiskEnabled && item.sizeOnDisk) {
      const sizeInGB = Number(item.sizeOnDisk) / (1024 * 1024 * 1024);

      if (sizeInGB < 1) {
        score += settings.sizeOnDisk1GB;
      } else if (sizeInGB < 5) {
        score += settings.sizeOnDisk5GB;
      } else if (sizeInGB < 10) {
        score += settings.sizeOnDisk10GB;
      } else if (sizeInGB < 20) {
        score += settings.sizeOnDisk20GB;
      } else if (sizeInGB < 50) {
        score += settings.sizeOnDisk50GB;
      } else {
        score += settings.sizeOnDiskOver50GB;
      }
    }

    // 4. Age since added factor
    if (settings.ageSinceAddedEnabled && item.dateAdded) {
      const daysSinceAdded = Math.floor(
        (Date.now() - item.dateAdded.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceAdded > 730) {
        score += settings.ageSinceAddedOver730;
      } else if (daysSinceAdded > 365) {
        score += settings.ageSinceAdded365Days;
      } else if (daysSinceAdded > 180) {
        score += settings.ageSinceAdded180Days;
      }
    }

    // 5. Folder remaining space factor
    if (
      settings.folderSpaceEnabled &&
      item.folderRemainingSpacePercent !== null &&
      item.folderRemainingSpacePercent !== undefined
    ) {
      if (item.folderRemainingSpacePercent < 10) {
        score += settings.folderSpace10Percent;
      } else if (item.folderRemainingSpacePercent < 20) {
        score += settings.folderSpace20Percent;
      } else if (item.folderRemainingSpacePercent < 30) {
        score += settings.folderSpace30Percent;
      } else if (item.folderRemainingSpacePercent < 50) {
        score += settings.folderSpace50Percent;
      }
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Generate a cache key for a media item and settings
   */
  private generateCacheKey(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): string {
    const itemKey = `${item.id}-${
      item.sizeOnDisk
    }-${item.dateAdded?.getTime()}-${item.lastWatched?.getTime()}-${
      item.folderRemainingSpacePercent
    }`;
    const settingsKey = this.hashSettings(settings);
    return `${itemKey}-${settingsKey}`;
  }

  /**
   * Generate a hash for the settings to detect changes
   */
  private hashSettings(settings: DeletionScoreSettings): string {
    // Create a simple hash of the settings object
    const settingsStr = JSON.stringify(settings);
    let hash = 0;
    for (let i = 0; i < settingsStr.length; i++) {
      const char = settingsStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

// Create a singleton instance
export const deletionScoreCalculator = new DeletionScoreCalculator();
