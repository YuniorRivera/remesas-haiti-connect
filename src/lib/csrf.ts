// CSRF Token Management

export function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}

export async function refreshCsrfToken(): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refresh CSRF token');
  }

  const data = await response.json();
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
