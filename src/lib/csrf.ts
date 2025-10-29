// CSRF Token Management

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='));
  return csrfCookie ? csrfCookie.split('=')[1] ?? null : null;
}

export async function refreshCsrfToken(): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'apikey': anonKey,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refresh CSRF token');
  }

  const data = (await response.json()) as { csrfToken?: string };
  if (!data.csrfToken || typeof data.csrfToken !== 'string') {
    throw new Error('Invalid CSRF token response');
  }
  
  return data.csrfToken;
}

export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    console.warn('No CSRF token found');
    return headers;
  }

  return {
    ...headers,
    'X-CSRF-Token': csrfToken,
  };
}
