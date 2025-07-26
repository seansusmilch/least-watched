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
  Info,
  TrendingUp,
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

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

  // Filter out disabled categories
  const enabledCategories = breakdown
    ? [
        {
          key: 'daysUnwatched',
          data: breakdown.daysUnwatched,
          icon: Clock,
          title: 'Days Unwatched',
        },
        {
          key: 'neverWatched',
          data: breakdown.neverWatched,
          icon: Eye,
          title: 'Never Watched Bonus',
        },
        {
          key: 'sizeOnDisk',
          data: breakdown.sizeOnDisk,
          icon: HardDrive,
          title: 'Size on Disk',
        },
        {
          key: 'ageSinceAdded',
          data: breakdown.ageSinceAdded,
          icon: Calendar,
          title: 'Age Since Added',
        },
        {
          key: 'folderSpace',
          data: breakdown.folderSpace,
          icon: FolderOpen,
          title: 'Folder Space',
        },
      ].filter((category) => category.data.enabled)
    : [];

  const toggleCategoryExpansion = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryExplanation = (
    categoryKey: string,
    data:
      | ScoreBreakdownData['daysUnwatched']
      | ScoreBreakdownData['neverWatched']
      | ScoreBreakdownData['sizeOnDisk']
      | ScoreBreakdownData['ageSinceAdded']
      | ScoreBreakdownData['folderSpace']
  ) => {
    switch (categoryKey) {
      case 'daysUnwatched': {
        const daysData = data as ScoreBreakdownData['daysUnwatched'];
        return `This item has been unwatched for ${daysData.daysSince} days. Items that haven't been watched recently get higher deletion scores. The longer since last watched (or added if never watched), the higher the score.`;
      }

      case 'neverWatched': {
        const neverData = data as ScoreBreakdownData['neverWatched'];
        return neverData.applies
          ? 'This item has never been watched, earning a bonus score. Items that have never been viewed are considered better candidates for deletion.'
          : "This item has been watched at least once, so no 'never watched' bonus is applied.";
      }

      case 'sizeOnDisk':
        return `This item takes up ${formatFileSize(
          item.sizeOnDisk || 0
        )} of disk space. Larger files get higher deletion scores as they free up more space when deleted.`;

      case 'ageSinceAdded': {
        const ageData = data as ScoreBreakdownData['ageSinceAdded'];
        return item.dateAdded
          ? `This item was added ${ageData.daysSince} days ago. Older items that have been in your library longer get higher deletion scores.`
          : 'No date added information available for this item.';
      }

      case 'folderSpace': {
        const folderData = data as ScoreBreakdownData['folderSpace'];
        return folderData.remainingPercent !== null &&
          folderData.remainingPercent !== undefined
          ? `The folder containing this item has ${folderData.remainingPercent}% remaining space. Items in folders with less available space get higher deletion scores.`
          : 'No folder space information available for this item.';
      }

      default:
        return '';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score > 70) return 'destructive';
    if (score > 40) return 'secondary';
    return 'outline';
  };

  const getPriorityLabel = (score: number) => {
    if (score > 70) return 'High Priority';
    if (score > 40) return 'Medium Priority';
    return 'Low Priority';
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
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-2xl font-bold'>
                    {breakdown.totalScore}/100
                  </span>
                  <Badge
                    variant={getPriorityColor(breakdown.totalScore)}
                    className='text-sm'
                  >
                    {getPriorityLabel(breakdown.totalScore)}
                  </Badge>
                </div>
                <Progress value={breakdown.totalScore} className='h-3' />
                <p className='text-sm text-muted-foreground mt-3'>
                  The overall deletion score is calculated by combining all
                  enabled factors. Higher scores indicate items that are better
                  candidates for deletion based on your configured preferences.
                </p>
              </CardContent>
            </Card>

            {/* Score Factors */}
            <div className='space-y-3'>
              {enabledCategories.map(({ key, data, icon: Icon, title }) => (
                <Card key={key}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4 text-muted-foreground' />
                        <span className='font-medium'>{title}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge variant='default'>
                          {data.pointsEarned}/{data.maxPoints}
                        </Badge>
                        <button
                          onClick={() => toggleCategoryExpansion(key)}
                          className='p-1 hover:bg-muted rounded transition-colors'
                          title='Show detailed explanation'
                        >
                          <Info className='h-4 w-4 text-muted-foreground hover:text-foreground' />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Category-specific details */}
                    <div className='text-sm text-muted-foreground'>
                      {key === 'daysUnwatched' && (
                        <div>
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

                      {key === 'neverWatched' && (
                        <div>
                          {breakdown.neverWatched.applies
                            ? 'Never watched'
                            : 'Has been watched'}
                        </div>
                      )}

                      {key === 'sizeOnDisk' && (
                        <div>
                          {formatFileSize(item.sizeOnDisk || 0)} (
                          {breakdown.sizeOnDisk.category})
                        </div>
                      )}

                      {key === 'ageSinceAdded' && item.dateAdded && (
                        <div>
                          {breakdown.ageSinceAdded.daysSince} days since added (
                          {breakdown.ageSinceAdded.category})
                          <div className='mt-1'>
                            Added: {formatDate(item.dateAdded)}
                          </div>
                        </div>
                      )}

                      {key === 'folderSpace' && (
                        <div>
                          {breakdown.folderSpace.remainingPercent !== null &&
                          breakdown.folderSpace.remainingPercent !== undefined
                            ? `${breakdown.folderSpace.remainingPercent}% remaining space (${breakdown.folderSpace.category})`
                            : 'No folder space data available'}
                        </div>
                      )}
                    </div>

                    {/* Detailed explanation when info icon is clicked */}
                    {expandedCategories.has(key) && (
                      <div className='mt-3 flex'>
                        <div className='w-1 bg-primary rounded-l-md mr-3' />
                        <div className='flex-1 p-3 bg-muted/50 rounded-md'>
                          <p className='text-sm text-muted-foreground'>
                            {getCategoryExplanation(key, data)}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Show message if no categories are enabled */}
              {enabledCategories.length === 0 && (
                <Card>
                  <CardContent className='pt-4'>
                    <div className='text-center text-muted-foreground py-4'>
                      <Info className='h-8 w-8 mx-auto mb-2 opacity-50' />
                      <p>
                        All deletion score categories are currently disabled.
                      </p>
                      <p className='text-sm mt-1'>
                        Enable categories in Settings → Deletion Score
                        Configuration to see scoring breakdown.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Summary */}
            {enabledCategories.length > 0 && (
              <Card>
                <CardContent className='pt-4'>
                  <h4 className='font-medium mb-2 flex items-center gap-2'>
                    <Info className='h-4 w-4' />
                    How to Use This Information
                  </h4>
                  <div className='text-sm text-muted-foreground space-y-2'>
                    <p>
                      • <strong>Higher scores</strong> indicate items that are
                      better candidates for deletion
                    </p>
                    <p>
                      • <strong>Disabled categories</strong> don&apos;t
                      contribute to the score
                    </p>
                    <p>
                      • <strong>Adjust weights</strong> in Settings to match
                      your priorities
                    </p>
                    <p>
                      • <strong>Consider context</strong> - scores are
                      suggestions, not automatic deletion commands
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className='text-center text-muted-foreground p-8'>
            <Info className='h-8 w-8 mx-auto mb-2 opacity-50' />
            <p>No breakdown data available</p>
            <p className='text-sm mt-1'>
              Check your deletion score settings to ensure scoring is enabled.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
