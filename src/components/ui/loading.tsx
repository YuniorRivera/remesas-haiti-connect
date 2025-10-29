/**
 * Loading Components
 * 
 * Reusable loading states for consistent UI
 */

import { ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-primary border-r-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Full-screen loading fallback for Suspense boundaries
 */
export function LoadingFallback({ 
  message = "Cargando...", 
  fullScreen = true 
}: LoadingFallbackProps) {
  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center" 
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="text-center">
        <LoadingSpinner size="md" className="mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  children: ReactNode;
  isLoading: boolean;
  message?: string;
}

/**
 * Loading overlay that covers content while loading
 */
export function LoadingOverlay({ 
  children, 
  isLoading, 
  message = "Cargando..." 
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
        <div className="text-center">
          <LoadingSpinner size="md" className="mb-4" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}

