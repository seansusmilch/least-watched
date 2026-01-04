'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { MediaItem } from '@/lib/types/media';
import { ImageOff, Film, Tv, Star, Clock, Eye, Calendar } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatters';

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
  const [imageError, setImageError] = useState(false);

  const hasEmbyConfig = embyUrl && embyApiKey && item.embyId;
  const posterUrl = hasEmbyConfig
    ? `${embyUrl}/Items/${item.embyId}/Images/Primary?maxWidth=300&api_key=${embyApiKey}`
    : null;

  const hasContent = posterUrl || item.overview;

  if (!hasContent) {
    return <div className='truncate'>{item.title}</div>;
  }

  const genres = item.genres
    ? Array.isArray(item.genres)
      ? item.genres
      : typeof item.genres === 'string'
      ? JSON.parse(item.genres)
      : []
    : [];

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

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
            {posterUrl && !imageError ? (
              <Image
                src={posterUrl}
                alt={`${item.title} poster`}
                width={140}
                height={210}
                className='rounded-md w-full max-w-[180px] md:max-w-none mx-auto md:mx-0 aspect-[2/3] object-cover'
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <div className='flex items-center justify-center w-full max-w-[180px] md:max-w-none mx-auto md:mx-0 aspect-[2/3] bg-muted rounded-md'>
                <ImageOff className='h-8 w-8 text-muted-foreground' />
              </div>
            )}
          </div>

          <div className='flex-1 min-w-0 space-y-2 md:space-y-3'>
            <div>
              <h4 className='font-semibold text-base leading-tight'>
                {item.title}
              </h4>
              <div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
                {item.type === 'movie' ? (
                  <Film className='h-3.5 w-3.5' />
                ) : (
                  <Tv className='h-3.5 w-3.5' />
                )}
                <span className='capitalize'>{item.type}</span>
                {item.year && (
                  <>
                    <span>•</span>
                    <span>{item.year}</span>
                  </>
                )}
                {item.quality && (
                  <>
                    <span>•</span>
                    <Badge
                      variant='secondary'
                      className='text-[10px] px-1.5 py-0'
                    >
                      {item.quality}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
              {(item.imdbRating || item.tmdbRating) && (
                <div className='flex items-center gap-1'>
                  <Star className='h-3 w-3 text-yellow-500 fill-yellow-500' />
                  <span>
                    {item.imdbRating
                      ? `${item.imdbRating.toFixed(1)} IMDb`
                      : `${item.tmdbRating?.toFixed(1)} TMDb`}
                  </span>
                </div>
              )}
              {item.runtime && (
                <div className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  <span>{formatRuntime(item.runtime)}</span>
                </div>
              )}
              {item.watchCount !== undefined && item.watchCount > 0 && (
                <div className='flex items-center gap-1'>
                  <Eye className='h-3 w-3' />
                  <span>
                    {item.watchCount} {item.watchCount === 1 ? 'play' : 'plays'}
                  </span>
                </div>
              )}
              {item.sizeOnDisk && (
                <div className='flex items-center gap-1'>
                  <span>{formatFileSize(item.sizeOnDisk)}</span>
                </div>
              )}
            </div>

            {item.type === 'tv' && item.seasonCount && (
              <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Calendar className='h-3 w-3' />
                <span>
                  {item.seasonCount}{' '}
                  {item.seasonCount === 1 ? 'season' : 'seasons'}
                  {item.episodesOnDisk && ` • ${item.episodesOnDisk} episodes`}
                </span>
              </div>
            )}

            {genres.length > 0 && (
              <div className='flex flex-wrap gap-1'>
                {genres.slice(0, 4).map((genre: string) => (
                  <Badge
                    key={genre}
                    variant='outline'
                    className='text-[10px] px-1.5 py-0'
                  >
                    {genre}
                  </Badge>
                ))}
                {genres.length > 4 && (
                  <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                    +{genres.length - 4}
                  </Badge>
                )}
              </div>
            )}

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
