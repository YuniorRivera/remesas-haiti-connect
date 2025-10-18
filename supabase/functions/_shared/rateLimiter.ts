/**
 * Simple in-memory rate limiter for Edge Functions
 * 
 * ⚠️ IMPORTANTE - SOLO PARA DESARROLLO:
 * Este rate limiter almacena datos en memoria y NO es adecuado para producción
 * en entornos con múltiples instancias de Edge Functions.
 * 
 * Para producción, se recomienda usar:
 * - Redis (self-hosted o managed)
 * - Upstash (Redis serverless)
 * - Cloudflare Rate Limiting
 * - Supabase Edge Functions con Deno KV (cuando esté disponible)
 * 
 * Limitaciones actuales:
 * - Los límites se reinician cuando la función se redeploya
 * - Cada instancia de la función tiene su propio contador
 * - No hay persistencia entre reinicios
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
