import { Badge } from '@/components/ui/badge';

interface GenreBadgesProps {
  genres: string[];
  maxVisible?: number;
}

export function GenreBadges({ genres, maxVisible = 4 }: GenreBadgesProps) {
  if (genres.length === 0) return null;

  const visibleGenres = genres.slice(0, maxVisible);
  const remainingCount = genres.length - maxVisible;

  return (
    <div className='flex flex-wrap gap-1'>
      {visibleGenres.map((genre) => (
        <Badge
          key={genre}
          variant='outline'
          className='text-[10px] px-1.5 py-0'
        >
          {genre}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
