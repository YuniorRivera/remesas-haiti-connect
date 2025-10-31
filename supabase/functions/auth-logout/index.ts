import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts'

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf

  try {
    // Verify CSRF token
    const csrfFromHeader = req.headers.get('x-csrf-token')
    const cookieHeader = req.headers.get('cookie')
    const csrfFromCookie = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('csrf-token='))
      ?.split('=')[1]

    if (!csrfFromHeader || !csrfFromCookie || csrfFromHeader !== csrfFromCookie) {
      return json({ error: 'Invalid CSRF token' }, 403, req)
    }

    // Extract session token
    const sessionToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('__Host-sid='))
      ?.split('=')[1]

    if (sessionToken) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: `Bearer ${sessionToken}` }
          }
        }
      )

      await supabaseClient.auth.signOut()
    }

    // Clear cookies
    const cookies = [
      `__Host-sid=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      `__Host-rt=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      `csrf-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    ]

    return json({ success: true }, { status: 200, headers: { 'Set-Cookie': cookies.join(', '), ...buildCorsHeaders(req) } })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'Internal server error' }, 500, req)
  }
})
