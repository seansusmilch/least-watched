'use client';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { MediaItem } from '@/lib/types/media';
import { parseGenres, buildEmbyPosterUrl } from '@/lib/utils/media';
import { MediaPoster } from './MediaPoster';
import { MediaHeader } from './MediaHeader';
import { MediaStats } from './MediaStats';
import { TvShowInfo } from './TvShowInfo';
import { GenreBadges } from './GenreBadges';

interface MediaTitleHoverCardProps {
  item: MediaItem;
  embyUrl?: string | null;
  embyApiKey?: string | null;
}

export function MediaTitleHoverCard({
  item,
  embyUrl,
  embyApiKey,
}: MediaTitleHoverCardProps) {
  const posterUrl =
    embyUrl && embyApiKey && item.embyId
      ? buildEmbyPosterUrl(embyUrl, embyApiKey, item.embyId)
      : null;

  const hasContent = posterUrl || item.overview;

  if (!hasContent) {
    return <div className='truncate'>{item.title}</div>;
  }

  const genres = parseGenres(item.genres);

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className='truncate cursor-pointer hover:underline'>
          {item.title}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        className='w-72 md:w-[480px] max-w-[calc(100vw-2rem)]'
        align='start'
        side='bottom'
      >
        <div className='flex flex-col md:flex-row gap-3 md:gap-4'>
          <div className='flex-shrink-0 w-full md:w-[140px]'>
            <MediaPoster posterUrl={posterUrl} title={item.title} />
          </div>

          <div className='flex-1 min-w-0 space-y-2 md:space-y-3'>
            <MediaHeader
              title={item.title}
              type={item.type}
              year={item.year}
              quality={item.quality}
            />

            <MediaStats
              imdbRating={item.imdbRating}
              tmdbRating={item.tmdbRating}
              runtime={item.runtime}
              watchCount={item.watchCount}
              sizeOnDisk={item.sizeOnDisk}
            />

            {item.type === 'tv' && (
              <TvShowInfo
                seasonCount={item.seasonCount}
                episodesOnDisk={item.episodesOnDisk}
              />
            )}

            <GenreBadges genres={genres} />

            {item.overview && (
              <p className='text-xs text-muted-foreground line-clamp-3 md:line-clamp-4 leading-relaxed'>
                {item.overview}
              </p>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
