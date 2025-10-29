/**
 * Optimized Image Component
 * 
 * Vite/React equivalent of Next.js Image component.
 * Provides lazy loading, priority loading, and optimized rendering.
 * 
 * Usage:
 * <OptimizedImage src="/image.jpg" alt="Description" priority />
 */

import { useState, useEffect, ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'fetchPriority'> {
  src: string;
  alt: string;
  priority?: boolean;
  fallback?: string;
}

/**
 * Optimized Image component with lazy loading and priority support
 * 
 * - priority=true: Load immediately (for LCP elements)
 * - priority=false: Lazy load (default)
 * - Automatic error handling with fallback
 */
export function OptimizedImage({
  src,
  alt,
  priority = false,
  fallback,
  className = "",
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (hasError && !fallback) {
    // Return placeholder if image fails and no fallback
    return (
      <div
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ minHeight: props.height || 200, minWidth: props.width || 200 }}
        role="img"
        aria-label={alt}
      >
        <span className="text-muted-foreground text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={handleError}
      onLoad={handleLoad}
      className={`${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200 ${className}`}
      style={{
        ...props.style,
        ...(isLoaded ? {} : { background: "var(--muted)" }),
      }}
    />
  );
}

