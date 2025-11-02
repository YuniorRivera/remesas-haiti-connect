/**
 * Type definitions for API responses and function invocations
 */

// Remittance types
export interface Remittance {
  id: string;
  codigo_referencia: string;
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
  principal_dop: number;
  channel: 'MONCASH' | 'SPIH';
  fx_client_sell: number;
  htg_to_beneficiary: number;
  client_fee_fixed_dop: number;
  client_fee_pct_dop: number;
  total_client_fees_dop: number;
  total_client_pays_dop: number;
  acquiring_cost_dop: number;
  gov_fee_dop: number;
  gov_fee_usd: number;
  store_commission_dop: number;
  quoted_at: string;
  // Admin-only fields
  fx_mid_dop_htg?: number;
  fx_spread_bps?: number;
  fx_spread_rev_dop?: number;
  htg_before_partner?: number;
  partner_fee_htg?: number;
  partner_cost_dop_equiv?: number;
  platform_commission_dop?: number;
  platform_gross_margin_dop?: number;
  total_platform_revenue?: number;
  total_costs?: number;
  breakdown?: any;
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

