import { type DeletionScoreSettings } from '@/lib/actions/settings/types';

export interface ScoringFactor {
  key: string;
  title: string;
  description: string;
  enabledKey: keyof DeletionScoreSettings;
  maxPointsKey: keyof DeletionScoreSettings;
  maxPoints: number;
  color: string;
  breakdownsKey?: keyof DeletionScoreSettings;
  breakdownUnit?: string;
}

// Scoring factor configurations
export const SCORING_FACTORS: ScoringFactor[] = [
  {
    key: 'daysUnwatched',
    title: 'Days Unwatched',
    description:
      "Media that hasn't been watched recently gets higher scores. The longer since last watched (or added if never watched), the higher the deletion score.",
    enabledKey: 'daysUnwatchedEnabled',
    maxPointsKey: 'daysUnwatchedMaxPoints',
    maxPoints: 30,
    color: 'bg-blue-500',
    breakdownsKey: 'daysUnwatchedBreakpoints',
    breakdownUnit: 'days',
  },
  {
    key: 'neverWatched',
    title: 'Never Watched Bonus',
    description:
      'Media that has never been watched receives additional points, making it more likely to be suggested for deletion.',
    enabledKey: 'neverWatchedEnabled',
    maxPointsKey: 'neverWatchedPoints',
    maxPoints: 20,
    color: 'bg-orange-500',
  },
  {
    key: 'sizeOnDisk',
    title: 'Size on Disk',
    description:
      'Larger media files receive higher scores. Deleting high-scoring items will free up more storage space.',
    enabledKey: 'sizeOnDiskEnabled',
    maxPointsKey: 'sizeOnDiskMaxPoints',
    maxPoints: 35,
    color: 'bg-green-500',
    breakdownsKey: 'sizeOnDiskBreakpoints',
    breakdownUnit: 'GB',
  },
  {
    key: 'ageSinceAdded',
    title: 'Age Since Added',
    description:
      'Media that was added to your library long ago receives higher scores. Recently added media is protected with lower scores.',
    enabledKey: 'ageSinceAddedEnabled',
    maxPointsKey: 'ageSinceAddedMaxPoints',
    maxPoints: 15,
    color: 'bg-purple-500',
    breakdownsKey: 'ageSinceAddedBreakpoints',
    breakdownUnit: 'days',
  },
  {
    key: 'folderSpace',
    title: 'Folder Space',
    description:
      'Media stored in folders with limited remaining space receives higher scores, helping to free up space in critical locations.',
    enabledKey: 'folderSpaceEnabled',
    maxPointsKey: 'folderSpaceMaxPoints',
    maxPoints: 10,
    color: 'bg-red-500',
    breakdownsKey: 'folderSpaceBreakpoints',
    breakdownUnit: '%',
  },
];

export const getDefaultSettings = (): DeletionScoreSettings => ({
  enabled: true,
  daysUnwatchedEnabled: true,
  daysUnwatchedMaxPoints: 30,
  daysUnwatchedBreakpoints: [
    { value: 30, percent: 0 },
    { value: 90, percent: 17 },
    { value: 180, percent: 50 },
    { value: 365, percent: 73 },
    { value: 366, percent: 100 },
  ],
  neverWatchedEnabled: true,
  neverWatchedPoints: 20,
  sizeOnDiskEnabled: true,
  sizeOnDiskMaxPoints: 35,
  sizeOnDiskBreakpoints: [
    { value: 1, percent: 0 },
    { value: 5, percent: 0 },
    { value: 10, percent: 29 },
    { value: 20, percent: 43 },
    { value: 50, percent: 71 },
    { value: 51, percent: 100 },
  ],
  ageSinceAddedEnabled: true,
  ageSinceAddedMaxPoints: 15,
  ageSinceAddedBreakpoints: [
    { value: 180, percent: 33 },
    { value: 365, percent: 67 },
    { value: 730, percent: 100 },
  ],
  folderSpaceEnabled: false,
  folderSpaceMaxPoints: 10,
  folderSpaceBreakpoints: [
    { value: 10, percent: 100 },
    { value: 20, percent: 80 },
    { value: 30, percent: 60 },
    { value: 50, percent: 30 },
  ],
});

// Helper function to convert percentage to actual points
export const getActualPoints = (
  percentage: number | undefined | null,
  maxPoints: number
) => {
  if (
    percentage === undefined ||
    percentage === null ||
    typeof percentage !== 'number' ||
    typeof maxPoints !== 'number' ||
    isNaN(percentage) ||
    isNaN(maxPoints)
  ) {
    return 0;
  }
  return Math.round((percentage / 100) * maxPoints);
};
