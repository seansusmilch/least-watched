'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Calendar,
  Clock,
  HardDrive,
  FolderOpen,
  Eye,
} from 'lucide-react';
import { MediaItem } from '@/lib/types/media';
import { formatDate, formatFileSize } from '@/lib/utils/formatters';
import {
  getDeletionScoreSettings,
  type DeletionScoreSettings,
} from '@/lib/actions/settings';

interface DeletionScoreBreakdownProps {
  item: MediaItem;
  open: boolean;
  onClose: () => void;
}

interface ScoreBreakdownData {
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

export function DeletionScoreBreakdown({
  item,
  open,
  onClose,
}: DeletionScoreBreakdownProps) {
  const [breakdown, setBreakdown] = useState<ScoreBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettingsAndCalculateBreakdown = useCallback(async () => {
    try {
      setLoading(true);
      const deletionSettings = await getDeletionScoreSettings();

      const breakdownData = calculateBreakdown(item, deletionSettings);
      setBreakdown(breakdownData);
    } catch (error) {
      console.error('Error loading deletion score breakdown:', error);
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (open) {
      loadSettingsAndCalculateBreakdown();
    }
  }, [open, loadSettingsAndCalculateBreakdown]);

  const calculateBreakdown = (
    item: MediaItem,
    settings: DeletionScoreSettings
  ): ScoreBreakdownData => {
    let totalScore = 0;

    // Days Unwatched calculation
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

    // Never Watched calculation
    const neverWatchedApplies = !item.lastWatched;
    let neverWatchedPoints = 0;
    if (settings.neverWatchedEnabled && neverWatchedApplies) {
      neverWatchedPoints = settings.neverWatchedPoints;
      totalScore += neverWatchedPoints;
    }

    // Size on Disk calculation
    const sizeInGB = (item.sizeOnDisk || 0) / (1024 * 1024 * 1024);
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

    // Age Since Added calculation
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

    // Folder Space calculation
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
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span>Deletion Score Breakdown</span>
            <Badge variant='outline'>{item.title}</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center p-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        ) : breakdown ? (
          <div className='space-y-4'>
            {/* Overall Score */}
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg'>Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <span className='text-2xl font-bold'>
                    {breakdown.totalScore}/100
                  </span>
                  <Badge
                    variant={
                      breakdown.totalScore > 70
                        ? 'destructive'
                        : breakdown.totalScore > 40
                        ? 'secondary'
                        : 'outline'
                    }
                    className='text-sm'
                  >
                    {breakdown.totalScore > 70
                      ? 'High Priority'
                      : breakdown.totalScore > 40
                      ? 'Medium Priority'
                      : 'Low Priority'}
                  </Badge>
                </div>
                <Progress value={breakdown.totalScore} className='mt-2' />
              </CardContent>
            </Card>

            {/* Score Factors */}
            <div className='space-y-3'>
              {/* Days Unwatched */}
              <Card>
                <CardContent className='pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>Days Unwatched</span>
                    </div>
                    <Badge
                      variant={
                        breakdown.daysUnwatched.enabled
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {breakdown.daysUnwatched.pointsEarned}/
                      {breakdown.daysUnwatched.maxPoints}
                    </Badge>
                  </div>
                  {breakdown.daysUnwatched.enabled && (
                    <div className='mt-2 text-sm text-muted-foreground'>
                      {breakdown.daysUnwatched.daysSince} days since{' '}
                      {item.lastWatched ? 'last watched' : 'added'} (
                      {breakdown.daysUnwatched.category})
                      {item.lastWatched && (
                        <div className='mt-1'>
                          <Eye className='h-3 w-3 inline mr-1' />
                          Last watched: {formatDate(item.lastWatched)}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Never Watched */}
              <Card>
                <CardContent className='pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Eye className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>Never Watched Bonus</span>
                    </div>
                    <Badge
                      variant={
                        breakdown.neverWatched.applies ? 'default' : 'secondary'
                      }
                    >
                      {breakdown.neverWatched.pointsEarned}/
                      {breakdown.neverWatched.maxPoints}
                    </Badge>
                  </div>
                  {breakdown.neverWatched.enabled && (
                    <div className='mt-2 text-sm text-muted-foreground'>
                      {breakdown.neverWatched.applies
                        ? 'Never watched'
                        : 'Has been watched'}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Size on Disk */}
              <Card>
                <CardContent className='pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <HardDrive className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>Size on Disk</span>
                    </div>
                    <Badge
                      variant={
                        breakdown.sizeOnDisk.enabled ? 'default' : 'secondary'
                      }
                    >
                      {breakdown.sizeOnDisk.pointsEarned}/
                      {breakdown.sizeOnDisk.maxPoints}
                    </Badge>
                  </div>
                  {breakdown.sizeOnDisk.enabled && (
                    <div className='mt-2 text-sm text-muted-foreground'>
                      {formatFileSize(item.sizeOnDisk || 0)} (
                      {breakdown.sizeOnDisk.category})
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Age Since Added */}
              <Card>
                <CardContent className='pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>Age Since Added</span>
                    </div>
                    <Badge
                      variant={
                        breakdown.ageSinceAdded.enabled
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {breakdown.ageSinceAdded.pointsEarned}/
                      {breakdown.ageSinceAdded.maxPoints}
                    </Badge>
                  </div>
                  {breakdown.ageSinceAdded.enabled && item.dateAdded && (
                    <div className='mt-2 text-sm text-muted-foreground'>
                      {breakdown.ageSinceAdded.daysSince} days since added (
                      {breakdown.ageSinceAdded.category})
                      <div className='mt-1'>
                        Added: {formatDate(item.dateAdded)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Folder Space */}
              <Card>
                <CardContent className='pt-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <FolderOpen className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>Folder Space</span>
                    </div>
                    <Badge
                      variant={
                        breakdown.folderSpace.enabled ? 'default' : 'secondary'
                      }
                    >
                      {breakdown.folderSpace.pointsEarned}/
                      {breakdown.folderSpace.maxPoints}
                    </Badge>
                  </div>
                  {breakdown.folderSpace.enabled && (
                    <div className='mt-2 text-sm text-muted-foreground'>
                      {breakdown.folderSpace.remainingPercent !== null &&
                      breakdown.folderSpace.remainingPercent !== undefined
                        ? `${breakdown.folderSpace.remainingPercent}% remaining space (${breakdown.folderSpace.category})`
                        : 'No folder space data available'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className='text-center text-muted-foreground p-8'>
            No breakdown data available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
