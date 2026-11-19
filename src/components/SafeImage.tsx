import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
}) => {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 text-slate-400 p-4 text-center ${className}`}
      >
        <BookOpen className="w-7 h-7 text-indigo-400 mb-1.5" />
        {fallbackTitle && (
          <span className="text-xs font-medium text-slate-300 line-clamp-2">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
      loading="lazy"
    />
  );
};
