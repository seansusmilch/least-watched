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
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import {
  deletionScoreCalculator,
  type ScoreBreakdownData,
  type MediaItemForScoring,
} from '@/lib/deletion-score-calculator';

interface DeletionScoreBreakdownProps {
  item: MediaItem;
  open: boolean;
  onClose: () => void;
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

      // Convert MediaItem to MediaItemForScoring format
      const itemForScoring: MediaItemForScoring = {
        id: item.id,
        sizeOnDisk: item.sizeOnDisk ? BigInt(item.sizeOnDisk) : null,
        dateAdded: item.dateAdded ? new Date(item.dateAdded) : null,
        lastWatched: item.lastWatched ? new Date(item.lastWatched) : null,
        folderRemainingSpacePercent: item.folderRemainingSpacePercent ?? null,
      };

      const breakdownData = deletionScoreCalculator.calculateScoreBreakdown(
        itemForScoring,
        deletionSettings
      );
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
