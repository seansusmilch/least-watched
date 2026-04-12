'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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

function getScoreColor(pct: number): 'red' | 'yellow' | 'green' {
  if (pct >= 0.75) return 'red';
  if (pct >= 0.4) return 'yellow';
  return 'green';
}

const colorClasses = {
  red: {
    bar: 'bg-red-500',
    badge: 'bg-red-600 text-white border-red-600',
    text: 'text-red-400',
  },
  yellow: {
    bar: 'bg-yellow-500',
    badge: 'bg-yellow-500 text-black border-yellow-500',
    text: 'text-yellow-400',
  },
  green: {
    bar: 'bg-green-500',
    badge: 'bg-green-600 text-white border-green-600',
    text: 'text-green-400',
  },
};

function ScoreBar({
  value,
  max,
  className = '',
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = getScoreColor(max > 0 ? value / max : 0);
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-white/10 ${className}`}
    >
      <div
        className={`h-full transition-all duration-500 ${colorClasses[color].bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
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
      <DialogContent
        className='max-w-lg max-h-[calc(100svh-4rem)] overflow-y-auto'
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 min-w-0'>
            <span className='shrink-0'>Score Breakdown</span>
            <Badge variant='outline' className='font-normal truncate min-w-0'>
              {item.title}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        ) : breakdown ? (
          <div className='min-w-0'>
            {/* Score header */}
            <div className='flex items-center gap-3 pb-4'>
              <div className='flex items-baseline gap-1 shrink-0'>
                <span className='text-4xl font-bold tabular-nums'>
                  {breakdown.totalScore}
                </span>
                <span className='text-lg text-muted-foreground'>/100</span>
              </div>
              <ScoreBar
                value={breakdown.totalScore}
                max={100}
                className='flex-1 min-w-0 h-2'
              />
              <Badge
                variant={getPriorityVariant(breakdown.totalScore)}
                className='shrink-0'
              >
                {getPriorityLabel(breakdown.totalScore)}
              </Badge>
            </div>

            <div className='border-t' />

            {/* Factor rows */}
            {enabledCategories.length > 0 ? (
              <div className='pt-1'>
                {enabledCategories.map(({ key, data, icon: Icon, title }, idx) => {
                  const color = getScoreColor(
                    data.maxPoints > 0 ? data.pointsEarned / data.maxPoints : 0
                  );
                  return (
                    <div
                      key={key}
                      className={`py-2.5 ${idx < enabledCategories.length - 1 ? 'border-b' : ''}`}
                    >
                      {/* Primary row: icon + title + [desktop: detail] + bar + badge + info */}
                      <div className='flex items-center gap-3'>
                        <Icon className='h-4 w-4 text-muted-foreground shrink-0' />
                        <span className='text-sm font-medium shrink-0 sm:w-32'>
                          {title}
                        </span>
                        {/* Detail text: desktop only */}
                        <span className='hidden sm:block text-xs text-muted-foreground flex-1 min-w-0 truncate'>
                          {getCategoryDetail(key, data)}
                        </span>
                        {/* Progress bar: desktop only */}
                        <ScoreBar
                          value={data.pointsEarned}
                          max={data.maxPoints}
                          className='hidden sm:block w-16 h-1.5 shrink-0'
                        />
                        <span
                          className={`ml-auto sm:ml-0 text-xs tabular-nums shrink-0 font-medium px-1.5 py-0.5 rounded border ${colorClasses[color].badge}`}
                        >
                          {data.pointsEarned}/{data.maxPoints}
                        </span>
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
                      {/* Secondary row: detail + bar on mobile only */}
                      <div className='flex items-center gap-2 mt-1.5 pl-7 sm:hidden'>
                        <span className='text-xs text-muted-foreground flex-1 min-w-0 truncate'>
                          {getCategoryDetail(key, data)}
                        </span>
                        <ScoreBar
                          value={data.pointsEarned}
                          max={data.maxPoints}
                          className='w-20 h-1.5 shrink-0'
                        />
                      </div>
                    </div>
                  );
                })}
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
