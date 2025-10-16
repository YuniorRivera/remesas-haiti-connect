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
    // Extract refresh token from cookie
    const cookieHeader = req.headers.get('cookie')
    const refreshToken = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('__Host-rt='))
      ?.split('=')[1]

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: 'No refresh token found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ error: error?.message || 'Session refresh failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate new CSRF token
    const csrfToken = crypto.randomUUID()

    // Update cookies
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
