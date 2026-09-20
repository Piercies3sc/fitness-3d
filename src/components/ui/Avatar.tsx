'use client';

import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  initials?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-16 h-16 sm:w-20 sm:h-20 text-lg sm:text-xl',
};

export function Avatar({
  src,
  name,
  initials,
  size = 'md',
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const fallbackText = initials || (name && name.trim().length > 0 ? name.trim().slice(0, 2).toUpperCase() : '??');
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  if (src && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || 'Profil Fotoğrafı'}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover shrink-0 border border-border-strong/70 bg-surface-high ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-surface-high border border-border-strong flex items-center justify-center font-bold text-text-primary select-none shrink-0 font-mono ${className}`}
      aria-label={name || 'Avatar'}
    >
      {fallbackText}
    </div>
  );
}
