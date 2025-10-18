/**
 * SIMPLE IN-MEMORY RATE LIMITER FOR DEVELOPMENT ONLY
 * 
 * ⚠️ CRITICAL WARNING: NOT PRODUCTION-READY ⚠️
 * 
 * This implementation uses in-memory storage and is NOT suitable for production.
 * 
 * Why this doesn't work in production:
 * 1. **Memory-based**: Clears on every edge function cold start (frequent in serverless)
 * 2. **Instance-specific**: Each edge function instance has separate memory
 * 3. **No coordination**: Multiple concurrent instances don't share rate limit state
 * 4. **Data loss**: Rate limit data is lost on restarts/deployments
 * 5. **Bypass risk**: Attackers can bypass limits by triggering new instances
 * 
 * Migration Path for Production:
 * 
 * Option 1: Upstash Redis (Recommended)
 * - Serverless-first Redis
 * - Built-in rate limiting: https://github.com/upstash/ratelimit-js
 * - Example:
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, "60 s"),
 *   });
 * 
 * Option 2: Deno KV (Native Deno solution)
 * - Built into Deno Deploy
 * - Example: https://deno.land/x/kv_rate_limit
 *   const kv = await Deno.openKv();
 *   const limiter = new RateLimiter(kv);
 * 
 * Option 3: Cloudflare Rate Limiting
 * - If deploying to Cloudflare Workers
 * - https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 * 
 * Option 4: Database-backed with row locks
 * - Use PostgreSQL with row-level locks
 * - Less performant but simpler setup
 * 
 * TODO: Migrate to production-grade distributed rate limiting before deploying to production.
 */

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
