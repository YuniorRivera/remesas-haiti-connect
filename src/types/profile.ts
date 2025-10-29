/**
 * Profile and user-related types
 */

export interface UserProfile {
  id: string;
  agent_id?: string | null;
  role?: string | null;
  full_name?: string | null;
  phone?: string | null;
  document?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Agent {
  id: string;
  trade_name?: string | null;
  legal_name?: string | null;
  rnc?: string | null;
  telefono?: string | null;
  is_active?: boolean | null;
  daily_limit_dop?: number | null;
}

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

export interface KybDocument {
  id: string;
  agent_id: string;
  document_type: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

export function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  return !!(
    profile.full_name &&
    profile.phone &&
    profile.document
  );
}

