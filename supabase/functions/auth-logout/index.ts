import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Credentials': 'true',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify CSRF token
    const csrfFromHeader = req.headers.get('x-csrf-token')
    const cookieHeader = req.headers.get('cookie')
    const csrfFromCookie = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('csrf-token='))
      ?.split('=')[1]

    if (!csrfFromHeader || !csrfFromCookie || csrfFromHeader !== csrfFromCookie) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      `__Host-sid=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
      `__Host-rt=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
      `csrf-token=; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    ]

    return new Response(
      JSON.stringify({ success: true }),
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
