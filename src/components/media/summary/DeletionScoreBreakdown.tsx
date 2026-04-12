'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Loader2,
  Calendar,
  Clock,
  HardDrive,
  FolderOpen,
  Eye,
  Info,
} from 'lucide-react';
import {
  MediaItem,
  getEffectiveDateAdded,
  type DatePreference,
} from '@/lib/types/media';
import { formatDate, formatFileSize } from '@/lib/utils/formatters';
import { convertMediaItemToScoringFormat } from '@/lib/utils/media-scoring';
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import { getDatePreference } from '@/lib/actions/settings/app-settings';
import {
  deletionScoreCalculator,
  type ScoreBreakdownData,
} from '@/lib/deletion-score-calculator';

interface DeletionScoreBreakdownProps {
  item: MediaItem;
  open: boolean;
  onClose: () => void;
}

function getScoreBadgeClass(earned: number, max: number): string {
  if (max === 0) return '';
  const pct = earned / max;
  if (pct >= 0.75) return 'bg-red-600 text-white hover:bg-red-700';
  if (pct >= 0.4) return 'bg-yellow-500 text-black hover:bg-yellow-600';
  return 'bg-green-600 text-white hover:bg-green-700';
}

function getScoreBarClass(score: number): string {
  if (score > 70) return '[&>div]:bg-red-500';
  if (score > 40) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-green-500';
}

function getFactorBarClass(earned: number, max: number): string {
  if (max === 0) return '';
  const pct = earned / max;
  if (pct >= 0.75) return '[&>div]:bg-red-500';
  if (pct >= 0.4) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-green-500';
}

export function DeletionScoreBreakdown({
  item,
  open,
  onClose,
}: DeletionScoreBreakdownProps) {
  const [breakdown, setBreakdown] = useState<ScoreBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [datePreference, setDatePreference] = useState<DatePreference>('arr');

  const getEffectiveDate = () => getEffectiveDateAdded(item, datePreference);

  const loadSettingsAndCalculateBreakdown = useCallback(async () => {
    try {
      setLoading(true);
      const [deletionSettings, fetchedDatePreference] = await Promise.all([
        getDeletionScoreSettings(),
        getDatePreference(),
      ]);

      setDatePreference(fetchedDatePreference);

      const itemForScoring = convertMediaItemToScoringFormat(
        item,
        fetchedDatePreference,
        item.folderRemainingSpacePercent
      );

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
          title: 'Never Watched',
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

  const getCategoryDetail = (
    categoryKey: string,
    data:
      | ScoreBreakdownData['daysUnwatched']
      | ScoreBreakdownData['neverWatched']
      | ScoreBreakdownData['sizeOnDisk']
      | ScoreBreakdownData['ageSinceAdded']
      | ScoreBreakdownData['folderSpace']
  ): string => {
    if (!breakdown) return '';
    switch (categoryKey) {
      case 'daysUnwatched': {
        const d = data as ScoreBreakdownData['daysUnwatched'];
        const suffix = item.lastWatched
          ? ` · last ${formatDate(item.lastWatched)}`
          : '';
        return `${d.daysSince}d · ${d.category}${suffix}`;
      }
      case 'neverWatched': {
        const d = data as ScoreBreakdownData['neverWatched'];
        return d.applies ? 'Never watched' : 'Has been watched';
      }
      case 'sizeOnDisk': {
        const d = data as ScoreBreakdownData['sizeOnDisk'];
        return `${formatFileSize(item.sizeOnDisk || 0)} · ${d.category}`;
      }
      case 'ageSinceAdded': {
        const d = data as ScoreBreakdownData['ageSinceAdded'];
        const effectiveDate = getEffectiveDate();
        const suffix = effectiveDate ? ` · added ${formatDate(effectiveDate)}` : '';
        return `${d.daysSince}d${suffix} · ${d.category}`;
      }
      case 'folderSpace': {
        const d = data as ScoreBreakdownData['folderSpace'];
        return d.remainingPercent !== null && d.remainingPercent !== undefined
          ? `${d.remainingPercent}% remaining · ${d.category}`
          : 'No data';
      }
      default:
        return '';
    }
  };

  const getCategoryExplanation = (
    categoryKey: string,
    data:
      | ScoreBreakdownData['daysUnwatched']
      | ScoreBreakdownData['neverWatched']
      | ScoreBreakdownData['sizeOnDisk']
      | ScoreBreakdownData['ageSinceAdded']
      | ScoreBreakdownData['folderSpace']
  ): string => {
    switch (categoryKey) {
      case 'daysUnwatched': {
        const d = data as ScoreBreakdownData['daysUnwatched'];
        return `Unwatched for ${d.daysSince} days. Score increases the longer an item remains unwatched.`;
      }
      case 'neverWatched': {
        const d = data as ScoreBreakdownData['neverWatched'];
        return d.applies
          ? 'Never watched bonus applied — items never viewed score higher.'
          : 'No bonus — item has been watched at least once.';
      }
      case 'sizeOnDisk':
        return `${formatFileSize(item.sizeOnDisk || 0)} on disk. Larger files score higher as they free more space.`;
      case 'ageSinceAdded': {
        const d = data as ScoreBreakdownData['ageSinceAdded'];
        return `Added ${d.daysSince} days ago. Older items score higher.`;
      }
      case 'folderSpace': {
        const d = data as ScoreBreakdownData['folderSpace'];
        return d.remainingPercent !== null && d.remainingPercent !== undefined
          ? `Folder has ${d.remainingPercent}% remaining. Items in fuller folders score higher.`
          : 'No folder space data available.';
      }
      default:
        return '';
    }
  };

  const getPriorityLabel = (score: number) => {
    if (score > 70) return 'High Priority';
    if (score > 40) return 'Medium Priority';
    return 'Low Priority';
  };

  const getPriorityVariant = (
    score: number
  ): 'destructive' | 'secondary' | 'outline' => {
    if (score > 70) return 'destructive';
    if (score > 40) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span>Score Breakdown</span>
            <Badge variant='outline' className='font-normal truncate max-w-48'>
              {item.title}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : breakdown ? (
          <div>
            {/* Score header */}
            <div className='flex items-center gap-4 pb-4'>
              <div className='flex items-baseline gap-1'>
                <span className='text-4xl font-bold tabular-nums'>
                  {breakdown.totalScore}
                </span>
                <span className='text-lg text-muted-foreground'>/100</span>
              </div>
              <Progress
                value={breakdown.totalScore}
                className={`flex-1 h-2 ${getScoreBarClass(breakdown.totalScore)}`}
              />
              <Badge variant={getPriorityVariant(breakdown.totalScore)}>
                {getPriorityLabel(breakdown.totalScore)}
              </Badge>
            </div>

            <div className='border-t' />

            {/* Factor rows */}
            {enabledCategories.length > 0 ? (
              <div className='pt-1'>
                {enabledCategories.map(({ key, data, icon: Icon, title }, idx) => (
                  <div
                    key={key}
                    className={`flex items-center gap-3 py-2.5 ${idx < enabledCategories.length - 1 ? 'border-b' : ''}`}
                  >
                    <Icon className='h-4 w-4 text-muted-foreground shrink-0' />
                    <span className='text-sm font-medium w-32 shrink-0'>
                      {title}
                    </span>
                    <span className='text-xs text-muted-foreground flex-1 truncate'>
                      {getCategoryDetail(key, data)}
                    </span>
                    <Progress
                      value={data.maxPoints > 0 ? (data.pointsEarned / data.maxPoints) * 100 : 0}
                      className={`w-16 h-1.5 shrink-0 ${getFactorBarClass(data.pointsEarned, data.maxPoints)}`}
                    />
                    <Badge
                      variant='default'
                      className={`text-xs tabular-nums shrink-0 ${getScoreBadgeClass(data.pointsEarned, data.maxPoints)}`}
                    >
                      {data.pointsEarned}/{data.maxPoints}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className='p-0.5 rounded hover:bg-muted transition-colors shrink-0'>
                          <Info className='h-3.5 w-3.5 text-muted-foreground' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='left' className='max-w-56'>
                        {getCategoryExplanation(key, data)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            ) : (
              <div className='py-8 text-center text-muted-foreground'>
                <Info className='h-6 w-6 mx-auto mb-2 opacity-40' />
                <p className='text-sm'>All scoring categories are disabled.</p>
                <p className='text-xs mt-1'>
                  Enable categories in Settings → Deletion Score.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className='py-8 text-center text-muted-foreground'>
            <Info className='h-6 w-6 mx-auto mb-2 opacity-40' />
            <p className='text-sm'>No breakdown data available.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
