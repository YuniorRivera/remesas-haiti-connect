/**
 * Machine Learning Fraud Scoring Hook (Placeholder for Future ML Integration)
 * 
 * This is a placeholder function that returns a fixed score.
 * In production, this would:
 * 1. Call an external ML service (e.g., AWS Fraud Detector, GCP AutoML, custom model)
 * 2. Send features derived from the order
 * 3. Return a probability score (0-1) or risk score (0-100)
 * 
 * Feature flag: ENABLE_ML_FRAUD_SCORE
 */

export interface MLFraudScoreRequest {
  emisor_documento: string;
  beneficiario_telefono: string;
  principal_dop: number;
  origin_ip: string | null;
  origin_device_fingerprint?: string;
  channel: 'MONCASH' | 'SPIH';
  payout_country?: string;
  transaction_history_count?: number;
  avg_transaction_amount?: number;
}

export interface MLFraudScoreResponse {
  score: number; // 0-100, where 0 is no risk, 100 is high risk
  confidence: number; // 0-1, model confidence
  features_used: string[];
  model_version?: string;
}

/**
 * Calculate fraud score using ML model (placeholder)
 */
export async function scoreFraud(order: MLFraudScoreRequest): Promise<MLFraudScoreResponse> {
  const enableML = Deno.env.get('ENABLE_ML_FRAUD_SCORE') === 'true';
  
  // If ML is disabled, return neutral score
  if (!enableML) {
    return {
      score: 0,
      confidence: 0,
      features_used: [],
    };
  }

  // TODO: Replace with actual ML service call
  // Example integrations:
  // 1. AWS Fraud Detector:
  //    const client = new FraudDetectorClient({ region: 'us-east-1' });
  //    const result = await client.predictModel({ ... });
  //
  // 2. Custom HTTP endpoint:
  //    const response = await fetch('https://ml-api.example.com/score', {
  //      method: 'POST',
  //      body: JSON.stringify(order),
  //    });
  //    const result = await response.json();
  //
  // 3. OnnxRuntime or TensorFlow.js for edge models

  // Placeholder: return a low baseline score
  // In production, this would analyze patterns like:
  // - Device fingerprint consistency
  // - Behavioral patterns (typing speed, mouse movements)
  // - Geographic inconsistencies
  // - Time-of-day patterns
  // - Network reputation
  // - Historical success/failure rates
  // - Graph analysis (connected accounts, beneficiaries)

  console.log('[ML Hook] Scoring fraud for order:', {
    emisor: order.emisor_documento?.substring(0, 4) + '***',
    beneficiario: order.beneficiario_telefono?.substring(0, 4) + '***',
    amount: order.principal_dop,
  });

  // For now, return a minimal risk score
  // Real implementation would use trained models to detect anomalies
  return {
    score: 5, // Low baseline risk
    confidence: 0.1, // Low confidence in placeholder
    features_used: [
      'emisor_documento',
      'beneficiario_telefono',
      'principal_dop',
      'origin_ip',
      'channel',
    ],
    model_version: 'placeholder-v1.0.0',
  };
}

/**
 * Helper to convert ML score to risk level
 */
export function mlScoreToRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

