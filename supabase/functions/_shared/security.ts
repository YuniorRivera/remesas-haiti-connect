type HeadersRecord = Record<string, string>;

const DEFAULT_SECURITY_HEADERS: HeadersRecord = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function parseAllowedOrigins(): string[] | '*':
  | string[]
  | '*'
{
  const raw = Deno.env.get('ALLOWED_ORIGINS');
  if (!raw) return '*';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : '*';
}

export function buildCorsHeaders(req: Request): HeadersRecord {
  const allowlist = parseAllowedOrigins();
  const reqOrigin = req.headers.get('origin') || '';
  const allowOrigin = Array.isArray(allowlist)
    ? (allowlist.includes(reqOrigin) ? reqOrigin : 'null')
    : '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Access-Control-Allow-Credentials': 'true',
    ...DEFAULT_SECURITY_HEADERS,
  };
}

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }
  return null;
}

export function json(data: unknown, init: number | ResponseInit = 200, req?: Request): Response {
  const status = typeof init === 'number' ? init : init.status ?? 200;
  const baseHeaders = req ? buildCorsHeaders(req) : DEFAULT_SECURITY_HEADERS;
  const extraHeaders = typeof init === 'number' ? {} : (init.headers as HeadersRecord | undefined) ?? {};
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}


