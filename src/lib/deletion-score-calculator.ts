import { DeletionScoreSettings } from './actions/settings';

export interface MediaItemForScoring {
  id: string;
  sizeOnDisk?: bigint | null;
  dateAdded?: Date | null;
  lastWatched?: Date | null;
  folderRemainingSpacePercent?: number | null;
}

export interface ScoreBreakdownData {
  daysUnwatched: {
    enabled: boolean;
    daysSince: number;
    pointsEarned: number;
    maxPoints: number;
    category: string;
  };
  neverWatched: {
    enabled: boolean;
    applies: boolean;
    pointsEarned: number;
    maxPoints: number;
  };
  sizeOnDisk: {
    enabled: boolean;
    sizeInGB: number;
    pointsEarned: number;
    maxPoints: number;
    category: string;
  };
  ageSinceAdded: {
    enabled: boolean;
    daysSince: number;
    pointsEarned: number;
    maxPoints: number;
    category: string;
  };
  folderSpace: {
    enabled: boolean;
    remainingPercent: number | null;
    pointsEarned: number;
    maxPoints: number;
    category: string;
  };
  totalScore: number;
}

export class DeletionScoreCalculator {
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

    try {
      const breakdown = this.performCalculation(item, settings);
      const score = breakdown.totalScore;

      // Ensure we never return NaN or invalid values
      if (isNaN(score) || !isFinite(score)) {
        console.warn(
          `Invalid deletion score calculated for item ${item.id}: ${score}, returning 0`
        );
        return 0;
      }

      return Math.max(0, Math.min(100, score)); // Ensure score is between 0 and 100
    } catch (error) {
      console.error(
        `Error calculating deletion score for item ${item.id}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Calculate deletion score breakdown for a single media item
   */
  calculateScoreBreakdown(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): ScoreBreakdownData {
    if (!settings.enabled) {
      return this.getEmptyBreakdown(settings);
    }

    return this.performCalculation(item, settings);
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
   * Return empty breakdown when scoring is disabled
   */
  private getEmptyBreakdown(
    settings: DeletionScoreSettings
  ): ScoreBreakdownData {
    return {
      daysUnwatched: {
        enabled: false,
        daysSince: 0,
        pointsEarned: 0,
        maxPoints: settings.daysUnwatchedMaxPoints,
        category: '',
      },
      neverWatched: {
        enabled: false,
        applies: false,
        pointsEarned: 0,
        maxPoints: settings.neverWatchedPoints,
      },
      sizeOnDisk: {
        enabled: false,
        sizeInGB: 0,
        pointsEarned: 0,
        maxPoints: settings.sizeOnDiskMaxPoints,
        category: '',
      },
      ageSinceAdded: {
        enabled: false,
        daysSince: 0,
        pointsEarned: 0,
        maxPoints: settings.ageSinceAddedMaxPoints,
        category: '',
      },
      folderSpace: {
        enabled: false,
        remainingPercent: null,
        pointsEarned: 0,
        maxPoints: settings.folderSpaceMaxPoints,
        category: '',
      },
      totalScore: 0,
    };
  }

  /**
   * Safely calculate percentage-based points
   */
  private calculatePercentagePoints(
    maxPoints: number | undefined,
    percentage: number | undefined
  ): number {
    // Handle undefined values
    if (maxPoints === undefined || percentage === undefined) {
      console.warn(
        `Undefined values for percentage calculation: maxPoints=${maxPoints}, percentage=${percentage}`
      );
      return 0;
    }

    if (
      isNaN(maxPoints) ||
      isNaN(percentage) ||
      !isFinite(maxPoints) ||
      !isFinite(percentage)
    ) {
      console.warn(
        `Invalid values for percentage calculation: maxPoints=${maxPoints}, percentage=${percentage}`
      );
      return 0;
    }
    return Math.round(maxPoints * (percentage / 100));
  }

  /**
   * Perform the actual deletion score calculation with breakdown
   */
  private performCalculation(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): ScoreBreakdownData {
    let totalScore = 0;

    // 1. Days unwatched factor
    const daysSinceReference = item.lastWatched
      ? Math.floor(
          (Date.now() - item.lastWatched.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    let daysUnwatchedPoints = 0;
    let daysUnwatchedCategory = '';

    if (settings.daysUnwatchedEnabled) {
      if (daysSinceReference <= 30) {
        daysUnwatchedPoints = this.calculatePercentagePoints(
          settings.daysUnwatchedMaxPoints,
          settings.daysUnwatched30DaysPercent
        );
        daysUnwatchedCategory = '≤30 days';
      } else if (daysSinceReference <= 90) {
        daysUnwatchedPoints = this.calculatePercentagePoints(
          settings.daysUnwatchedMaxPoints,
          settings.daysUnwatched90DaysPercent
        );
        daysUnwatchedCategory = '31-90 days';
      } else if (daysSinceReference <= 180) {
        daysUnwatchedPoints = this.calculatePercentagePoints(
          settings.daysUnwatchedMaxPoints,
          settings.daysUnwatched180DaysPercent
        );
        daysUnwatchedCategory = '91-180 days';
      } else if (daysSinceReference <= 365) {
        daysUnwatchedPoints = this.calculatePercentagePoints(
          settings.daysUnwatchedMaxPoints,
          settings.daysUnwatched365DaysPercent
        );
        daysUnwatchedCategory = '181-365 days';
      } else {
        daysUnwatchedPoints = this.calculatePercentagePoints(
          settings.daysUnwatchedMaxPoints,
          settings.daysUnwatchedOver365Percent
        );
        daysUnwatchedCategory = '>365 days';
      }
      totalScore += daysUnwatchedPoints;
    }

    // 2. Never watched bonus
    const neverWatchedApplies = !item.lastWatched;
    let neverWatchedPoints = 0;
    if (settings.neverWatchedEnabled && neverWatchedApplies) {
      neverWatchedPoints = settings.neverWatchedPoints;
      totalScore += neverWatchedPoints;
    }

    // 3. Size on disk factor
    const sizeInGB = item.sizeOnDisk
      ? Number(item.sizeOnDisk) / (1024 * 1024 * 1024)
      : 0;
    let sizeOnDiskPoints = 0;
    let sizeOnDiskCategory = '';

    if (settings.sizeOnDiskEnabled && item.sizeOnDisk) {
      if (sizeInGB < 1) {
        sizeOnDiskPoints = this.calculatePercentagePoints(
          settings.sizeOnDiskMaxPoints,
          settings.sizeOnDisk1GBPercent
        );
        sizeOnDiskCategory = '<1GB';
      } else if (sizeInGB < 5) {
        sizeOnDiskPoints = this.calculatePercentagePoints(
          settings.sizeOnDiskMaxPoints,
          settings.sizeOnDisk5GBPercent
        );
        sizeOnDiskCategory = '1-5GB';
      } else if (sizeInGB < 10) {
        sizeOnDiskPoints = this.calculatePercentagePoints(
          settings.sizeOnDiskMaxPoints,
          settings.sizeOnDisk10GBPercent
        );
        sizeOnDiskCategory = '5-10GB';
      } else if (sizeInGB < 20) {
        sizeOnDiskPoints = this.calculatePercentagePoints(
          settings.sizeOnDiskMaxPoints,
          settings.sizeOnDisk20GBPercent
        );
        sizeOnDiskCategory = '10-20GB';
      } else if (sizeInGB < 50) {
        sizeOnDiskPoints = this.calculatePercentagePoints(
          settings.sizeOnDiskMaxPoints,
          settings.sizeOnDisk50GBPercent
        );
        sizeOnDiskCategory = '20-50GB';
      } else {
        sizeOnDiskPoints = this.calculatePercentagePoints(
          settings.sizeOnDiskMaxPoints,
          settings.sizeOnDiskOver50GBPercent
        );
        sizeOnDiskCategory = '≥50GB';
      }
      totalScore += sizeOnDiskPoints;
    }

    // 4. Age since added factor
    const daysSinceAdded = item.dateAdded
      ? Math.floor(
          (Date.now() - item.dateAdded.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;
    let ageSinceAddedPoints = 0;
    let ageSinceAddedCategory = '';

    if (settings.ageSinceAddedEnabled && item.dateAdded) {
      if (daysSinceAdded > 730) {
        ageSinceAddedPoints = this.calculatePercentagePoints(
          settings.ageSinceAddedMaxPoints,
          settings.ageSinceAddedOver730Percent
        );
        ageSinceAddedCategory = '>730 days';
      } else if (daysSinceAdded > 365) {
        ageSinceAddedPoints = this.calculatePercentagePoints(
          settings.ageSinceAddedMaxPoints,
          settings.ageSinceAdded365DaysPercent
        );
        ageSinceAddedCategory = '365-730 days';
      } else if (daysSinceAdded > 180) {
        ageSinceAddedPoints = this.calculatePercentagePoints(
          settings.ageSinceAddedMaxPoints,
          settings.ageSinceAdded180DaysPercent
        );
        ageSinceAddedCategory = '180-365 days';
      } else {
        ageSinceAddedCategory = '≤180 days';
      }
      totalScore += ageSinceAddedPoints;
    }

    // 5. Folder remaining space factor
    let folderSpacePoints = 0;
    let folderSpaceCategory = '';

    if (
      settings.folderSpaceEnabled &&
      item.folderRemainingSpacePercent !== null &&
      item.folderRemainingSpacePercent !== undefined
    ) {
      if (item.folderRemainingSpacePercent < 10) {
        folderSpacePoints = this.calculatePercentagePoints(
          settings.folderSpaceMaxPoints,
          settings.folderSpace10PercentPercent
        );
        folderSpaceCategory = '<10% remaining';
      } else if (item.folderRemainingSpacePercent < 20) {
        folderSpacePoints = this.calculatePercentagePoints(
          settings.folderSpaceMaxPoints,
          settings.folderSpace20PercentPercent
        );
        folderSpaceCategory = '10-20% remaining';
      } else if (item.folderRemainingSpacePercent < 30) {
        folderSpacePoints = this.calculatePercentagePoints(
          settings.folderSpaceMaxPoints,
          settings.folderSpace30PercentPercent
        );
        folderSpaceCategory = '20-30% remaining';
      } else if (item.folderRemainingSpacePercent < 50) {
        folderSpacePoints = this.calculatePercentagePoints(
          settings.folderSpaceMaxPoints,
          settings.folderSpace50PercentPercent
        );
        folderSpaceCategory = '30-50% remaining';
      } else {
        folderSpaceCategory = '≥50% remaining';
      }
      totalScore += folderSpacePoints;
    }

    return {
      daysUnwatched: {
        enabled: settings.daysUnwatchedEnabled,
        daysSince: daysSinceReference,
        pointsEarned: daysUnwatchedPoints,
        maxPoints: settings.daysUnwatchedMaxPoints,
        category: daysUnwatchedCategory,
      },
      neverWatched: {
        enabled: settings.neverWatchedEnabled,
        applies: neverWatchedApplies,
        pointsEarned: neverWatchedPoints,
        maxPoints: settings.neverWatchedPoints,
      },
      sizeOnDisk: {
        enabled: settings.sizeOnDiskEnabled,
        sizeInGB,
        pointsEarned: sizeOnDiskPoints,
        maxPoints: settings.sizeOnDiskMaxPoints,
        category: sizeOnDiskCategory,
      },
      ageSinceAdded: {
        enabled: settings.ageSinceAddedEnabled,
        daysSince: daysSinceAdded,
        pointsEarned: ageSinceAddedPoints,
        maxPoints: settings.ageSinceAddedMaxPoints,
        category: ageSinceAddedCategory,
      },
      folderSpace: {
        enabled: settings.folderSpaceEnabled,
        remainingPercent: item.folderRemainingSpacePercent ?? null,
        pointsEarned: folderSpacePoints,
        maxPoints: settings.folderSpaceMaxPoints,
        category: folderSpaceCategory,
      },
      totalScore: Math.min(totalScore, 100),
    };
  }
}

// Create a singleton instance
export const deletionScoreCalculator = new DeletionScoreCalculator();
