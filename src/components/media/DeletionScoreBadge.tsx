'use client';

import { Badge } from '@/components/ui/badge';

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
    return <span className='text-muted-foreground'>N/A</span>;
  }

  const getScoreColor = (score: number) => {
    if (score > 70) return 'destructive';
    if (score > 40) return 'secondary';
    return 'outline';
  };

  return (
    <div className='flex items-center gap-2'>
      <Badge
        variant={getScoreColor(score)}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
        onClick={onClick}
      >
        {score}
      </Badge>
      {showHighPriority && score > 70 && (
        <span className='text-xs text-destructive font-medium'>
          High Priority
        </span>
      )}
    </div>
  );
}
