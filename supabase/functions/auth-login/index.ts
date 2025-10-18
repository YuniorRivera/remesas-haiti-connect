import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { checkRateLimit } from '../_shared/rateLimiter.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Credentials': 'true',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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
      return new Response(
        JSON.stringify({ 
          error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          } 
        }
      );
    }
    
    // Input validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate CSRF token
    const csrfToken = crypto.randomUUID()

    // Create secure cookies
    const cookies = [
      `__Host-sid=${data.session.access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
      `__Host-rt=${data.session.refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
      `csrf-token=${csrfToken}; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
    ]

    return new Response(
      JSON.stringify({ 
        user: data.user,
        csrfToken,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': cookies.join(', '),
        },
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
