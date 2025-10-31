import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { checkRateLimit } from '../_shared/rateLimiter.ts'
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts'

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf

  try {
    const { email, password } = await req.json()
    
    // Rate limiting: 5 login attempts per 15 minutes per IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `login:${clientIp}`;
    
    const rateLimit = checkRateLimit(rateLimitKey, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    });
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return json({ 
        error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' 
      }, { status: 429, headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
        ...buildCorsHeaders(req)
      }})
    }
    
    // Input validation
    if (!email || !password) {
      return json({ error: 'Email y contraseña requeridos' }, 400, req)
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Formato de email inválido' }, 400, req)
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error)
      return json({ error: error.message }, 401, req)
    }

    // Generate CSRF token
    const csrfToken = crypto.randomUUID()

    // Create secure cookies
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
