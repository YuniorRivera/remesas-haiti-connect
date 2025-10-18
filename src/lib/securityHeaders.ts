/**
 * Security headers configuration
 * These headers help protect against common web vulnerabilities
 */

export const SECURITY_HEADERS = {
  // HSTS: Force HTTPS for 1 year, including subdomains
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking by disallowing the page to be framed
  'X-Frame-Options': 'DENY',
  
  // Enable browser's XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Restrict access to browser features
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * Content Security Policy
 * Restricts which resources can be loaded
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://esm.sh', 'https://unpkg.com'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
} as const;

export function buildCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Get all security headers as a single object
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Content-Security-Policy': buildCSP(),
  };
}
