/**
 * Type definitions for API responses and function invocations
 */

// Remittance types
export interface Remittance {
  id: string;
  emisor_nombre: string;
  emisor_telefono?: string | null;
  emisor_documento?: string | null;
  beneficiario_nombre: string;
  beneficiario_telefono: string;
  beneficiario_documento?: string | null;
  principal_dop: number;
  channel: 'MONCASH' | 'SPIH';
  payout_city?: string | null;
  origin_ip?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
}

// Quote response from pricing-quote function
export interface PricingQuote {
  success: boolean;
  remittance: Remittance;
  fees: {
    total_fee_dop: number;
    exchange_rate: number;
    payout_htg: number;
  };
  error?: string;
}

// Create remittance response
export interface CreateRemittanceResponse {
  success: boolean;
  remittance: Remittance;
  message?: string;
  error?: string;
}

// Confirm remittance response
export interface ConfirmRemittanceResponse {
  success: boolean;
  remittance: Remittance;
  message?: string;
  error?: string;
}

// Fraud detection response
export interface FraudDetectionResponse {
  should_block: boolean;
  risk_level: 'low' | 'medium' | 'high';
  flags: string[];
  message?: string;
}

// Supabase function error
export interface SupabaseFunctionError {
  message: string;
  statusCode?: number;
  error?: string;
}

// Reconciliation types
export interface ReconciliationData {
  remittances: ReconciliationRemittance[];
  metadata?: Record<string, unknown>;
}

export interface ReconciliationRemittance {
  remittance_id: string;
  amount: number;
  channel: string;
  status: string;
  date: string;
}

export interface ReconciliationResult {
  success: boolean;
  summary: {
    matched: number;
    unmatched: number;
    errors: number;
  };
  matches?: ReconciliationMatch[];
  unmatched?: ReconciliationRemittance[];
}

export interface ReconciliationMatch {
  remittance_id: string;
  source_id: string;
  confidence: number;
}

