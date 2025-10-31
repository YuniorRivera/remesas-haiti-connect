import { buildCorsHeaders, preflight, json } from '../_shared/security.ts'

Deno.serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf

  try {
    // Generate new CSRF token
    const csrfToken = crypto.randomUUID()

    const cookie = `csrf-token=${csrfToken}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600`
    return json({ csrfToken }, { status: 200, headers: { 'Set-Cookie': cookie, ...buildCorsHeaders(req) } })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'Internal server error' }, 500, req)
  }
})
