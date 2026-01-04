import { Badge } from '@/components/ui/badge';
import { Film, Tv } from 'lucide-react';

interface MediaHeaderProps {
  title: string;
  type: string;
  year?: number | null;
  quality?: string | null;
}

export function MediaHeader({ title, type, year, quality }: MediaHeaderProps) {
  return (
    <div>
      <h4 className='font-semibold text-base leading-tight'>{title}</h4>
      <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
        {type === 'movie' ? (
          <Film className='h-3.5 w-3.5' />
        ) : (
          <Tv className='h-3.5 w-3.5' />
        )}
        <span className='capitalize'>{type}</span>
        {year && (
          <>
            <span>•</span>
            <span>{year}</span>
          </>
        )}
        {quality && (
          <>
            <span>•</span>
            <Badge variant='secondary' className='text-[10px] px-1.5 py-0'>
              {quality}
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}
