'use client';

import { cn } from '@/lib/utils';

interface DeletionScoreBadgeProps {
  score: number | null | undefined;
  onClick?: () => void;
  className?: string;
  showHighPriority?: boolean;
}

export function DeletionScoreBadge({
  score,
  onClick,
  className = '',
  showHighPriority = true,
}: DeletionScoreBadgeProps) {
  if (score === undefined || score === null) {
    return <span className='text-muted-foreground text-sm'>—</span>;
  }

  const isHigh = score > 70;
  const isMid = score > 40 && score <= 70;

  return (
    <div className='flex items-center gap-2'>
      <button
        type='button'
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center font-mono text-sm font-semibold tabular-nums',
          'w-12 h-7 rounded border transition-all',
          isHigh &&
            'bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/20',
          isMid &&
            'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
          !isHigh &&
            !isMid &&
            'bg-muted border-border text-muted-foreground hover:bg-muted/80',
          onClick ? 'cursor-pointer' : 'cursor-default',
          className
        )}
      >
        {score}
      </button>
      {showHighPriority && isHigh && (
        <span className='text-[11px] font-semibold text-destructive uppercase tracking-wide'>
          High
        </span>
      )}
    </div>
  );
}
