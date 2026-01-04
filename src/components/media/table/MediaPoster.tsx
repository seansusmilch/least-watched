'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

interface MediaPosterProps {
  posterUrl: string | null;
  title: string;
  className?: string;
}

export function MediaPoster({
  posterUrl,
  title,
  className = '',
}: MediaPosterProps) {
  const [imageError, setImageError] = useState(false);

  if (posterUrl && !imageError) {
    return (
      <Image
        src={posterUrl}
        alt={`${title} poster`}
        width={140}
        height={210}
        className={`rounded-md w-full max-w-[180px] md:max-w-none mx-auto md:mx-0 aspect-[2/3] object-cover ${className}`}
        unoptimized
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className='flex items-center justify-center w-full max-w-[180px] md:max-w-none mx-auto md:mx-0 aspect-[2/3] bg-muted rounded-md'>
      <ImageOff className='h-8 w-8 text-muted-foreground' />
    </div>
  );
}
