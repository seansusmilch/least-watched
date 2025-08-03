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

  private getPointsForValue(
    value: number,
    breakpoints: { value: number; percent: number }[],
    maxPoints: number
  ): { points: number; category: string } {
    if (breakpoints.length === 0) {
      return { points: 0, category: '' };
    }

    const sortedBreakpoints = [...breakpoints].sort((a, b) => a.value - b.value);

    let foundBreakpoint = sortedBreakpoints.find((bp) => value <= bp.value);

    if (!foundBreakpoint) {
      foundBreakpoint = sortedBreakpoints[sortedBreakpoints.length - 1];
    }

    const index = sortedBreakpoints.indexOf(foundBreakpoint);
    const prevValue = index > 0 ? sortedBreakpoints[index - 1].value : 0;

    let category = ``;
    if (index === 0) {
      category = `≤${foundBreakpoint.value}`;
    } else if (value > foundBreakpoint.value) {
      category = `>${foundBreakpoint.value}`;
    } else {
      category = `${prevValue + 1}-${foundBreakpoint.value}`;
    }

    return {
      points: this.calculatePercentagePoints(maxPoints, foundBreakpoint.percent),
      category: category,
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
    const referenceDate = item.lastWatched || item.dateAdded;
    const daysSinceReference = referenceDate
      ? Math.floor(
          (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    let daysUnwatchedPoints = 0;
    let daysUnwatchedCategory = '';

    if (settings.daysUnwatchedEnabled) {
      const { points, category } = this.getPointsForValue(
        daysSinceReference,
        settings.daysUnwatchedBreakpoints,
        settings.daysUnwatchedMaxPoints
      );
      daysUnwatchedPoints = points;
      daysUnwatchedCategory = category;
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
      const { points, category } = this.getPointsForValue(
        sizeInGB,
        settings.sizeOnDiskBreakpoints,
        settings.sizeOnDiskMaxPoints
      );
      sizeOnDiskPoints = points;
      sizeOnDiskCategory = category;
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
      const { points, category } = this.getPointsForValue(
        daysSinceAdded,
        settings.ageSinceAddedBreakpoints,
        settings.ageSinceAddedMaxPoints
      );
      ageSinceAddedPoints = points;
      ageSinceAddedCategory = category;
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
      const { points, category } = this.getPointsForValue(
        item.folderRemainingSpacePercent,
        settings.folderSpaceBreakpoints,
        settings.folderSpaceMaxPoints
      );
      folderSpacePoints = points;
      folderSpaceCategory = category;
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
