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

    const breakdown = this.performCalculation(item, settings);
    return breakdown.totalScore;
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
   * Perform the actual deletion score calculation with breakdown
   */
  private performCalculation(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): ScoreBreakdownData {
    let totalScore = 0;

    // 1. Days unwatched factor
    const referenceDate = item.lastWatched || item.dateAdded || new Date();
    const daysSinceReference = Math.floor(
      (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let daysUnwatchedPoints = 0;
    let daysUnwatchedCategory = '';

    if (settings.daysUnwatchedEnabled) {
      if (daysSinceReference <= 30) {
        daysUnwatchedPoints = settings.daysUnwatched30Days;
        daysUnwatchedCategory = '≤30 days';
      } else if (daysSinceReference <= 90) {
        daysUnwatchedPoints = settings.daysUnwatched90Days;
        daysUnwatchedCategory = '31-90 days';
      } else if (daysSinceReference <= 180) {
        daysUnwatchedPoints = settings.daysUnwatched180Days;
        daysUnwatchedCategory = '91-180 days';
      } else if (daysSinceReference <= 365) {
        daysUnwatchedPoints = settings.daysUnwatched365Days;
        daysUnwatchedCategory = '181-365 days';
      } else {
        daysUnwatchedPoints = settings.daysUnwatchedOver365;
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
        sizeOnDiskPoints = settings.sizeOnDisk1GB;
        sizeOnDiskCategory = '<1GB';
      } else if (sizeInGB < 5) {
        sizeOnDiskPoints = settings.sizeOnDisk5GB;
        sizeOnDiskCategory = '1-5GB';
      } else if (sizeInGB < 10) {
        sizeOnDiskPoints = settings.sizeOnDisk10GB;
        sizeOnDiskCategory = '5-10GB';
      } else if (sizeInGB < 20) {
        sizeOnDiskPoints = settings.sizeOnDisk20GB;
        sizeOnDiskCategory = '10-20GB';
      } else if (sizeInGB < 50) {
        sizeOnDiskPoints = settings.sizeOnDisk50GB;
        sizeOnDiskCategory = '20-50GB';
      } else {
        sizeOnDiskPoints = settings.sizeOnDiskOver50GB;
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
        ageSinceAddedPoints = settings.ageSinceAddedOver730;
        ageSinceAddedCategory = '>730 days';
      } else if (daysSinceAdded > 365) {
        ageSinceAddedPoints = settings.ageSinceAdded365Days;
        ageSinceAddedCategory = '365-730 days';
      } else if (daysSinceAdded > 180) {
        ageSinceAddedPoints = settings.ageSinceAdded180Days;
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
        folderSpacePoints = settings.folderSpace10Percent;
        folderSpaceCategory = '<10% remaining';
      } else if (item.folderRemainingSpacePercent < 20) {
        folderSpacePoints = settings.folderSpace20Percent;
        folderSpaceCategory = '10-20% remaining';
      } else if (item.folderRemainingSpacePercent < 30) {
        folderSpacePoints = settings.folderSpace30Percent;
        folderSpaceCategory = '20-30% remaining';
      } else if (item.folderRemainingSpacePercent < 50) {
        folderSpacePoints = settings.folderSpace50Percent;
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
