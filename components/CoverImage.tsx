'use client';

import React, { useState } from 'react';

interface CoverImageProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  type?: 'album' | 'artist' | 'track';
}

export default function CoverImage({
  src,
  fallbackSrc,
  alt,
  className = '',
  type = 'album',
}: CoverImageProps) {
  const [prevSrc, setPrevSrc] = useState<string | null | undefined>(src);
  const [useFallback, setUseFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setUseFallback(false);
    setHasError(false);
  }

  const activeSrc = useFallback ? fallbackSrc : (src || fallbackSrc);

  const handleError = () => {
    if (!useFallback && fallbackSrc && fallbackSrc !== src) {
      setUseFallback(true);
    } else {
      setHasError(true);
    }
  };

  if (!activeSrc || hasError) {
    return (
      <div
        className={`bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col items-center justify-center border border-zinc-800 text-zinc-600 select-none p-2 text-center ${className}`}
      >
        <span className="material-icons-round text-3xl opacity-40 block">
          {type === 'artist' ? 'person' : type === 'track' ? 'music_note' : 'album'}
        </span>
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1 truncate max-w-full px-1">
          {alt || (type === 'artist' ? 'Artist' : 'Album')}
        </span>
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      onError={handleError}
      className={className}
    />
  );
}
