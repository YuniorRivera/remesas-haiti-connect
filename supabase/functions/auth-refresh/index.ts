import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { checkRateLimit } from '../_shared/rateLimiter.ts'
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts'

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf

  try {
    // Extract refresh token from cookie
    const cookieHeader = req.headers.get('cookie')
    const refreshToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('__Host-rt='))
      ?.split('=')[1]

    if (!refreshToken) {
      return json({ error: 'No refresh token found' }, 401, req)
    }

    // Rate limiting: refresh 30/5m por IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateKey = `refresh:${clientIp}`;
    const rl = checkRateLimit(rateKey, { windowMs: 5 * 60 * 1000, maxRequests: 30 });
    if (!rl.allowed) {
      return json({ error: 'Demasiadas solicitudes de refresh. Intenta más tarde.' }, { status: 429, headers: {
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': rl.remaining.toString(),
        'X-RateLimit-Reset': new Date(rl.resetAt).toISOString(),
        ...buildCorsHeaders(req)
      }})
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      console.error('Refresh error:', error)
      return json({ error: error?.message || 'Session refresh failed' }, 401, req)
    }

    // Generate new CSRF token
    const csrfToken = crypto.randomUUID()

    // Update cookies
    const cookies = [
      `__Host-sid=${data.session.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
      `__Host-rt=${data.session.refresh_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
      `csrf-token=${csrfToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
    ]

    return json({ user: data.user, csrfToken }, { status: 200, headers: { 'Set-Cookie': cookies.join(', '), ...buildCorsHeaders(req) } })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'Internal server error' }, 500, req)
  }
})
