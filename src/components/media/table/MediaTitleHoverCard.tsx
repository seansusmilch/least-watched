'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { MediaItem } from '@/lib/types/media';
import { ImageOff } from 'lucide-react';

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
    ? `${embyUrl}/Items/${item.embyId}/Images/Primary?maxWidth=200&api_key=${embyApiKey}`
    : null;

  const hasContent = posterUrl || item.overview;

  if (!hasContent) {
    return <div className='truncate'>{item.title}</div>;
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className='truncate cursor-pointer hover:underline'>
          {item.title}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className='w-80' align='start' side='right'>
        <div className='flex flex-col gap-3'>
          {posterUrl && !imageError && (
            <div className='flex justify-center'>
              <Image
                src={posterUrl}
                alt={`${item.title} poster`}
                width={320}
                height={240}
                className='rounded-md max-h-60 object-cover'
                unoptimized
                onError={() => setImageError(true)}
              />
            </div>
          )}
          {posterUrl && imageError && (
            <div className='flex items-center justify-center h-32 bg-muted rounded-md'>
              <ImageOff className='h-8 w-8 text-muted-foreground' />
            </div>
          )}
          <div className='space-y-2'>
            <h4 className='text-sm font-semibold'>{item.title}</h4>
            {item.year && (
              <p className='text-xs text-muted-foreground'>{item.year}</p>
            )}
            {item.overview && (
              <p className='text-xs text-muted-foreground line-clamp-6'>
                {item.overview}
              </p>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
