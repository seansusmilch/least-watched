import { DeletionScoreSettings } from './actions/settings/types';
import type { DatePreference } from './types/media';

export interface MediaItemForScoring {
  id: string;
  sizeOnDisk?: bigint | null;
  dateAddedEmby?: Date | null;
  dateAddedArr?: Date | null;
  datePreference?: DatePreference;
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
   * Determines which dateAdded value to use based on the date preference setting
   */
  private getEffectiveDateAdded(item: MediaItemForScoring): Date | null {
    const datePreference = item.datePreference || 'arr';

    const embyDate = item.dateAddedEmby;
    const arrDate = item.dateAddedArr;

    switch (datePreference) {
      case 'emby':
        return embyDate || arrDate || null;
      case 'arr':
        return arrDate || embyDate || null;
      case 'oldest':
        if (embyDate && arrDate) {
          return embyDate < arrDate ? embyDate : arrDate;
        }
        return embyDate || arrDate || null;
      default:
        return arrDate || embyDate || null;
    }
  }

  /**
   * Calculate deletion score for a single media item
   */
  calculateScore(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): number {
    // Validate inputs
    if (!item || !item.id) {
      console.warn('Invalid media item provided for scoring');
      return 0;
    }

    if (!settings) {
      console.warn('No settings provided for scoring calculation');
      return 0;
    }

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
    // Validate inputs
    if (!item || !item.id) {
      console.warn('Invalid media item provided for breakdown calculation');
      return this.getEmptyBreakdown(settings);
    }

    if (!settings) {
      console.warn('No settings provided for breakdown calculation');
      return this.getEmptyBreakdown(settings);
    }

    if (!settings.enabled) {
      return this.getEmptyBreakdown(settings);
    }

    try {
      return this.performCalculation(item, settings);
    } catch (error) {
      console.error(
        `Error calculating score breakdown for item ${item.id}:`,
        error
      );
      return this.getEmptyBreakdown(settings);
    }
  }

  /**
   * Calculate deletion scores for multiple media items
   */
  calculateScoresForItems(
    items: MediaItemForScoring[],
    settings: DeletionScoreSettings
  ): Map<string, number> {
    // Validate inputs
    if (!Array.isArray(items)) {
      console.warn('Invalid items array provided for batch scoring');
      return new Map();
    }

    if (!settings) {
      console.warn('No settings provided for batch scoring');
      return new Map();
    }

    const scores = new Map<string, number>();

    for (const item of items) {
      try {
        const score = this.calculateScore(item, settings);
        scores.set(item.id, score);
      } catch (error) {
        console.error(
          `Error calculating score for item ${item?.id || 'unknown'}:`,
          error
        );
        // Continue with other items instead of failing completely
        scores.set(item?.id || 'unknown', 0);
      }
    }

    return scores;
  }

  /**
   * Return empty breakdown when scoring is disabled
   */
  private getEmptyBreakdown(
    settings: DeletionScoreSettings
  ): ScoreBreakdownData {
    // Handle case where settings might be undefined
    const safeSettings = settings || {
      daysUnwatchedMaxPoints: 0,
      neverWatchedPoints: 0,
      sizeOnDiskMaxPoints: 0,
      ageSinceAddedMaxPoints: 0,
      folderSpaceMaxPoints: 0,
    };

    return {
      daysUnwatched: {
        enabled: false,
        daysSince: 0,
        pointsEarned: 0,
        maxPoints: safeSettings.daysUnwatchedMaxPoints || 0,
        category: '',
      },
      neverWatched: {
        enabled: false,
        applies: false,
        pointsEarned: 0,
        maxPoints: safeSettings.neverWatchedPoints || 0,
      },
      sizeOnDisk: {
        enabled: false,
        sizeInGB: 0,
        pointsEarned: 0,
        maxPoints: safeSettings.sizeOnDiskMaxPoints || 0,
        category: '',
      },
      ageSinceAdded: {
        enabled: false,
        daysSince: 0,
        pointsEarned: 0,
        maxPoints: safeSettings.ageSinceAddedMaxPoints || 0,
        category: '',
      },
      folderSpace: {
        enabled: false,
        remainingPercent: null,
        pointsEarned: 0,
        maxPoints: safeSettings.folderSpaceMaxPoints || 0,
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

    // Ensure percentage is within valid range
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const points = Math.round(maxPoints * (clampedPercentage / 100));

    // Ensure points are within valid range
    return Math.max(0, Math.min(maxPoints, points));
  }

  /**
   * Calculate points for a value based on breakpoints.
   *
   * Breakpoints are checked in descending order (highest to lowest).
   * The first breakpoint where the item's value is GREATER THAN the breakpoint value
   * determines the score. If no breakpoint is exceeded, the item gets 0 points.
   *
   * Example: For breakpoints [50, 20, 10] and item value 25:
   * - Check 50: 25 > 50? No, continue
   * - Check 20: 25 > 20? Yes! Use this breakpoint's percentage
   */
  private getPointsForValue(
    value: number,
    breakpoints: { value: number; percent: number }[],
    maxPoints: number,
    unit: string = ''
  ): { points: number; category: string } {
    // Validate inputs
    if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
      console.warn('No breakpoints provided for scoring calculation');
      return { points: 0, category: 'No breakpoints defined' };
    }

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      console.warn(`Invalid value provided for scoring: ${value}`);
      return { points: 0, category: 'Invalid value' };
    }

    if (
      typeof maxPoints !== 'number' ||
      isNaN(maxPoints) ||
      !isFinite(maxPoints)
    ) {
      console.warn(`Invalid maxPoints provided for scoring: ${maxPoints}`);
      return { points: 0, category: 'Invalid configuration' };
    }

    // Validate breakpoint structure
    for (const bp of breakpoints) {
      if (
        typeof bp.value !== 'number' ||
        typeof bp.percent !== 'number' ||
        isNaN(bp.value) ||
        isNaN(bp.percent) ||
        !isFinite(bp.value) ||
        !isFinite(bp.percent)
      ) {
        console.warn('Invalid breakpoint structure detected:', bp);
        return { points: 0, category: 'Invalid breakpoints' };
      }
    }

    // Sort breakpoints from highest value to lowest for efficient checking
    const sortedBreakpoints = [...breakpoints].sort(
      (a, b) => b.value - a.value
    );

    // Find the first breakpoint where the item's value is greater than the breakpoint value
    for (const breakpoint of sortedBreakpoints) {
      if (value > breakpoint.value) {
        return {
          points: this.calculatePercentagePoints(maxPoints, breakpoint.percent),
          category: `Greater than ${breakpoint.value}${unit ? ` ${unit}` : ''}`,
        };
      }
    }

    // If the value doesn't exceed any breakpoint, it gets 0 points
    const lowestBreakpoint = sortedBreakpoints[sortedBreakpoints.length - 1];
    return {
      points: 0,
      category: `Less than or equal to ${lowestBreakpoint.value}${
        unit ? ` ${unit}` : ''
      }`,
    };
  }

  /**
   * Perform the actual deletion score calculation with breakdown
   */
  private performCalculation(
    item: MediaItemForScoring,
    settings: DeletionScoreSettings
  ): ScoreBreakdownData {
    // Validate inputs
    if (!item || !settings) {
      console.warn('Invalid inputs provided to performCalculation');
      return this.getEmptyBreakdown(settings);
    }

    let totalScore = 0;

    // 1. Days unwatched factor
    const effectiveDateAdded = this.getEffectiveDateAdded(item);
    const referenceDate = item.lastWatched || effectiveDateAdded;
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
        settings.daysUnwatchedMaxPoints,
        'days'
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
        settings.sizeOnDiskMaxPoints,
        'GB'
      );
      sizeOnDiskPoints = points;
      sizeOnDiskCategory = category;
      totalScore += sizeOnDiskPoints;
    }

    // 4. Age since added factor
    const daysSinceAdded = effectiveDateAdded
      ? Math.floor(
          (Date.now() - effectiveDateAdded.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;
    let ageSinceAddedPoints = 0;
    let ageSinceAddedCategory = '';

    if (settings.ageSinceAddedEnabled && effectiveDateAdded) {
      const { points, category } = this.getPointsForValue(
        daysSinceAdded,
        settings.ageSinceAddedBreakpoints,
        settings.ageSinceAddedMaxPoints,
        'days'
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
        settings.folderSpaceMaxPoints,
        '%'
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
