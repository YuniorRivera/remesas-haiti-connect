/**
 * Utility functions for role-based access control and field visibility
 */

export type UserRole = 'admin' | 'agent_owner' | 'agent_clerk' | 'compliance_officer' | 'sender';

/**
 * Check if a user has a specific role
 */
export function hasRole(userRoles: string[], role: UserRole): boolean {
  return userRoles.includes(role);
}

/**
 * Check if a user has admin role
 */
export function isAdmin(userRoles: string[]): boolean {
  return hasRole(userRoles, 'admin');
}

/**
 * Check if a user has any agent role
 */
export function isAgent(userRoles: string[]): boolean {
  return hasRole(userRoles, 'agent_owner') || hasRole(userRoles, 'agent_clerk');
}

/**
 * Fields that should only be visible to admins
 */
export const ADMIN_ONLY_FIELDS = [
  'platform_gross_margin_dop',
  'platform_commission_dop',
  'fx_spread_rev_dop',
  'partner_cost_dop_equiv',
  'acquiring_cost_dop',
  'margen_plataforma',
  'comision_agente', // Admin can see this, but agents see a filtered version
];

/**
 * Fields that should be hidden from agents (store users)
 */
export const AGENT_HIDDEN_FIELDS = [
  'platform_gross_margin_dop',
  'platform_commission_dop',
  'fx_spread_rev_dop',
  'partner_cost_dop_equiv',
  'acquiring_cost_dop',
  'margen_plataforma',
];

/**
 * Filter object fields based on user role
 */
export function filterFieldsByRole<T extends Record<string, any>>(
  data: T,
  userRoles: string[]
): Partial<T> {
  if (isAdmin(userRoles)) {
    return data; // Admins see everything
  }

  const filtered: Partial<T> = {};
  
  for (const key in data) {
    if (!AGENT_HIDDEN_FIELDS.includes(key)) {
      filtered[key] = data[key];
    }
  }

  return filtered;
}

/**
 * Check if a field should be visible based on user role
 */
export function shouldShowField(fieldName: string, userRoles: string[]): boolean {
  if (isAdmin(userRoles)) {
    return true;
  }

  return !AGENT_HIDDEN_FIELDS.includes(fieldName);
}

/**
 * Sensitive data fields that require extra protection
 */
export const SENSITIVE_FIELDS = [
  'documento_identidad',
  'emisor_documento',
  'beneficiario_documento',
  'cuenta_bancaria_encriptada',
  'origin_device_fingerprint',
  'origin_ip',
];

/**
 * Mask sensitive data (show only last 4 characters)
 */
export function maskSensitiveData(value: string | null | undefined): string {
  if (!value) return '****';
  if (value.length <= 4) return '****';
  return '****' + value.slice(-4);
}

/**
 * Check if user can view sensitive data
 */
export function canViewSensitiveData(userRoles: string[]): boolean {
  return isAdmin(userRoles) || hasRole(userRoles, 'compliance_officer');
}
