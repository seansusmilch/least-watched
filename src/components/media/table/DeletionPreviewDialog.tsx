'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaItem } from '@/lib/types/media';
import { formatFileSize } from '@/lib/utils/formatters';
import { Loader2, AlertTriangle, ImageOff, Trash2 } from 'lucide-react';
import {
  deletionScoreCalculator,
  ScoreBreakdownData,
} from '@/lib/deletion-score-calculator';
import { getDeletionScoreSettings } from '@/lib/actions/settings';
import { getDatePreference } from '@/lib/actions/settings/app-settings';
import { convertMediaItemToScoringFormat } from '@/lib/utils/media-scoring';
import { DeletionScoreBreakdown } from '../summary/DeletionScoreBreakdown';
import { DeletionScoreBadge } from '../DeletionScoreBadge';

interface DeletionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MediaItem[];
  onConfirm: () => void;
  embyUrl?: string | null;
  embyApiKey?: string | null;
}

export function DeletionPreviewDialog({
  open,
  onOpenChange,
  items,
  onConfirm,
  embyUrl,
  embyApiKey,
}: DeletionPreviewDialogProps) {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Map<string, ScoreBreakdownData>>(
    new Map()
  );
  const [breakdownItem, setBreakdownItem] = useState<MediaItem | null>(null);
  const cancelledRef = useRef(false);

  const totalSize = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.sizeOnDisk) || 0), 0),
    [items]
  );

  useEffect(() => {
    if (open && items.length > 0) {
      cancelledRef.current = false;
      setLoading(true);

      const calculateScores = async () => {
        try {
          const [settings, datePreference] = await Promise.all([
            getDeletionScoreSettings(),
            getDatePreference(),
          ]);

          if (cancelledRef.current) {
            return;
          }

          const newScores = new Map<string, ScoreBreakdownData>();

          for (const item of items) {
            if (cancelledRef.current) {
              return;
            }

            const itemForScoring = convertMediaItemToScoringFormat(
              item,
              datePreference,
              item.folderRemainingSpacePercent
            );
            const scoreData = deletionScoreCalculator.calculateScoreBreakdown(
              itemForScoring,
              settings
            );
            newScores.set(item.id, scoreData);
          }

          if (!cancelledRef.current) {
            setScores(newScores);
            setLoading(false);
          }
        } catch (error) {
          if (!cancelledRef.current) {
            console.error('Error calculating scores:', error);
            setLoading(false);
          }
        }
      };

      calculateScores();

      return () => {
        cancelledRef.current = true;
      };
    } else {
      setLoading(false);
    }
  }, [open, items]);

  const formatCategoryValue = (
    key: string,
    data:
      | ScoreBreakdownData['daysUnwatched']
      | ScoreBreakdownData['sizeOnDisk']
      | ScoreBreakdownData['ageSinceAdded']
      | ScoreBreakdownData['folderSpace']
  ): string => {
    switch (key) {
      case 'daysUnwatched': {
        const daysData = data as ScoreBreakdownData['daysUnwatched'];
        return `${daysData.daysSince} days`;
      }
      case 'sizeOnDisk': {
        const sizeData = data as ScoreBreakdownData['sizeOnDisk'];
        return `${sizeData.sizeInGB.toFixed(1)} GB`;
      }
      case 'ageSinceAdded': {
        const ageData = data as ScoreBreakdownData['ageSinceAdded'];
        return `${ageData.daysSince} days`;
      }
      case 'folderSpace': {
        const folderData = data as ScoreBreakdownData['folderSpace'];
        return folderData.remainingPercent !== null
          ? `${folderData.remainingPercent}% remaining`
          : 'N/A';
      }
      default:
        return '';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-3xl lg:max-w-5xl xl:max-w-6xl h-[85vh] flex flex-col overflow-hidden'>
          <DialogHeader className='shrink-0'>
            <DialogTitle className='flex items-center gap-2 text-destructive text-xl lg:text-2xl'>
              <AlertTriangle className='h-6 w-6' />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className='text-base'>
              Are you sure you want to delete {items.length} items? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className='flex-1 min-h-0'>
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <Loader2 className='h-8 w-8 animate-spin' />
              </div>
            ) : (
              <ScrollArea className='h-full -mr-4 pr-4'>
                <div className='space-y-3'>
                  {items.map((item) => {
                    const scoreData = scores.get(item.id);
                    const hasEmbyConfig = embyUrl && embyApiKey && item.embyId;
                    const posterUrl = hasEmbyConfig
                      ? `${embyUrl}/Items/${item.embyId}/Images/Primary?maxWidth=100&api_key=${embyApiKey}`
                      : null;

                    const enabledCategories = scoreData
                      ? [
                          {
                            key: 'daysUnwatched',
                            data: scoreData.daysUnwatched,
                            label: 'Days Unwatched',
                          },

                          {
                            key: 'sizeOnDisk',
                            data: scoreData.sizeOnDisk,
                            label: 'Size',
                          },
                          {
                            key: 'ageSinceAdded',
                            data: scoreData.ageSinceAdded,
                            label: 'Age',
                          },
                          {
                            key: 'folderSpace',
                            data: scoreData.folderSpace,
                            label: 'Folder Space',
                          },
                        ].filter(
                          (cat) => cat.data.enabled && cat.data.pointsEarned > 0
                        )
                      : [];

                    return (
                      <div
                        key={item.id}
                        className='flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
                      >
                        <div className='flex gap-3 sm:gap-4 flex-1'>
                          <div className='flex-shrink-0 w-20 h-28 sm:w-24 sm:h-36 bg-muted rounded overflow-hidden flex items-center justify-center'>
                            {posterUrl ? (
                              <Image
                                src={posterUrl}
                                alt={item.title}
                                width={96}
                                height={144}
                                className='w-full h-full object-cover'
                                unoptimized
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageOff className='h-8 w-8 text-muted-foreground' />
                            )}
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2'>
                              <div className='min-w-0'>
                                <h4 className='font-semibold text-base lg:text-lg truncate'>
                                  {item.title}
                                </h4>
                              </div>
                              {scoreData && (
                                <DeletionScoreBadge
                                  score={scoreData.totalScore}
                                  onClick={() => setBreakdownItem(item)}
                                  className='shrink-0 h-7 px-3 text-sm'
                                />
                              )}
                            </div>

                            {scoreData && enabledCategories.length > 0 && (
                              <div className='flex flex-wrap gap-2'>
                                {enabledCategories
                                  .sort(
                                    (a, b) =>
                                      b.data.pointsEarned - a.data.pointsEarned
                                  )
                                  .slice(0, 3)
                                  .map((cat) => (
                                    <div
                                      key={cat.key}
                                      className='flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded text-xs'
                                    >
                                      <span className='text-muted-foreground'>
                                        {cat.label}:
                                      </span>
                                      <span className='font-medium'>
                                        {formatCategoryValue(cat.key, cat.data)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className='shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t pt-4 mt-3'>
            <div className='text-sm text-muted-foreground'>
              Items to be deleted:
              <span className='font-semibold ml-2 text-foreground'>
                {items.length}
              </span>
            </div>
            <div className='text-sm text-muted-foreground'>
              Space to be freed:
              <span className='font-semibold ml-2 text-foreground'>
                {formatFileSize(totalSize)}
              </span>
            </div>
          </div>

          <DialogFooter className='shrink-0 space-x-2 gap-2 sm:gap-0 mt-3'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={onConfirm}>
              <Trash2 className='h-4 w-4 mr-2' />
              Yes, Delete {items.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breakdown Dialog for detailed view */}
      {breakdownItem && (
        <DeletionScoreBreakdown
          item={breakdownItem}
          open={!!breakdownItem}
          onClose={() => setBreakdownItem(null)}
        />
      )}
    </>
  );
}
