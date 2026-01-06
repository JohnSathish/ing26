import { useState, useEffect, useRef } from 'react';

/**
 * Image utility functions for lazy loading and error handling
 */

/**
 * Get image URL with fallback
 */
export function getImageUrl(url: string | null | undefined, fallback: string = '/placeholder.jpg'): string {
  if (!url || url.trim() === '') {
    return fallback;
  }
  
  // If URL is already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  
  // If URL starts with /, it's a relative path
  if (url.startsWith('/')) {
    return url;
  }
  
  // Otherwise, prepend /uploads/ if it's a relative path
  return `/uploads/${url}`;
}

/**
 * Lazy load image with intersection observer
 */
export function useLazyImage(src: string, fallback?: string) {
  const [imageSrc, setImageSrc] = useState<string>(fallback || '/placeholder.jpg');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = getImageUrl(src);
            img.onload = () => {
              setImageSrc(getImageUrl(src));
              setIsLoaded(true);
            };
            img.onerror = () => {
              setHasError(true);
              if (fallback) {
                setImageSrc(fallback);
              }
            };
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, fallback]);

  return { imageSrc, isLoaded, hasError, imgRef };
}

/**
 * Handle image error with fallback
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = '/placeholder.jpg'
) {
  const target = e.target as HTMLImageElement;
  if (target.src !== fallback) {
    target.src = fallback;
  } else {
    target.style.display = 'none';
  }
}
