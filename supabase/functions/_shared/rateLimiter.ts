// Simple in-memory rate limiter for Edge Functions
// For production, use Redis or Upstash

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(identifier);
  }

  const currentEntry = rateLimitStore.get(identifier);

  if (!currentEntry) {
    // First request
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (currentEntry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: currentEntry.resetAt,
    };
  }

  // Increment counter
  currentEntry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - currentEntry.count,
    resetAt: currentEntry.resetAt,
  };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute
