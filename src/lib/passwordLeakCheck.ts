/**
 * Password Leak Check using Have I Been Pwned k-anonymity API
 * 
 * Uses SHA-1 partial hash to check password against known data breaches
 * Feature flag: VITE_ENABLE_PASSWORD_LEAK_CHECK
 */

// Log status at module load
const isEnabled = import.meta.env.VITE_ENABLE_PASSWORD_LEAK_CHECK === 'true';
console.log(`🔒 Protección de contraseñas filtradas: ${isEnabled ? 'ACTIVA' : 'DESACTIVADA'}`);

interface PasswordLeakCheckResult {
  isCompromised: boolean;
  count?: number;
  error?: string;
}

/**
 * Check if password has been found in data breaches using Have I Been Pwned API
 * Uses k-anonymity: only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordLeak(password: string): Promise<PasswordLeakCheckResult> {
  // Check feature flag
  if (!isEnabled) {
    return { isCompromised: false };
  }

  try {
    // Hash password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // k-anonymity: send only first 5 chars
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Fetch from HIBP API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    
    if (!response.ok) {
      console.error('Password leak check failed:', response.statusText);
      return { isCompromised: false }; // Fail open: don't block on API error
    }

    const body = await response.text();
    
    // Parse response: lines are "SUFFIX:COUNT"
    const lines = body.split('\n');
    const foundHash = lines.find(line => 
      line.trim().split(':')[0] === suffix
    );

    if (foundHash) {
      const count = parseInt(foundHash.split(':')[1]?.trim() || '0');
      return {
        isCompromised: true,
        count,
      };
    }

    return { isCompromised: false };
  } catch (error) {
    console.error('Error checking password leak:', error);
    // Fail open: don't block registration on network errors
    return { isCompromised: false };
  }
}

/**
 * Get user-friendly message for compromised password
 */
export function getPasswordLeakMessage(count?: number): string {
  if (count && count > 100000) {
    return 'Esta contraseña ha sido encontrada en más de 100,000 filtraciones de datos. Por favor, elige una contraseña diferente y única.';
  } else if (count && count > 10000) {
    return 'Esta contraseña ha aparecido en múltiples filtraciones de datos. Por favor, elige una contraseña más segura.';
  } else if (count && count > 1000) {
    return 'Esta contraseña ha sido expuesta en filtraciones de datos. Te recomendamos usar una contraseña diferente.';
  }
  return 'Esta contraseña ha aparecido en una filtración de datos conocida. Por tu seguridad, por favor elige una contraseña diferente.';
}

