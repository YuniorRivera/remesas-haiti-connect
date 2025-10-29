import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts';

const fraudCheckSchema = z.object({
  emisor_documento: z.string().min(1, "Documento del emisor requerido"),
  beneficiario_telefono: z.string().min(1, "Teléfono del beneficiario requerido"),
  principal_dop: z.number().positive("El monto debe ser positivo"),
  origin_ip: z.string().optional(),
});

interface FraudCheckRequest {
  emisor_documento: string;
  beneficiario_telefono: string;
  principal_dop: number;
  origin_ip: string;
}

interface FraudCheckResponse {
  is_suspicious: boolean;
  risk_level: 'low' | 'medium' | 'high';
  flags: string[];
  should_block: boolean;
}

const LIMITS = {
  MAX_DAILY_TRANSACTIONS_PER_SENDER: 10,
  MAX_DAILY_AMOUNT_PER_SENDER_DOP: 500000,
  MAX_MONTHLY_AMOUNT_PER_SENDER_DOP: 2000000,
  MAX_TRANSACTIONS_SAME_BENEFICIARY_DAILY: 3,
  MIN_TIME_BETWEEN_TRANSACTIONS_MINUTES: 2,
  SUSPICIOUS_ROUND_AMOUNT_THRESHOLD: 50000,
  MAX_VELOCITY_TRANSACTIONS_PER_HOUR: 5,
};

serve(async (req) => {
  const pf = preflight(req)
  if (pf) return pf

  try {
    // Validar CSRF token
    const csrfToken = req.headers.get('X-CSRF-Token');
    const csrfCookie = req.headers.get('Cookie')?.split(';')
      .find(c => c.trim().startsWith('csrf-token='))
      ?.split('=')[1];

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      console.error('CSRF validation failed');
      return json({ 
        error: 'CSRF token inválido',
        is_suspicious: false,
        risk_level: 'low',
        flags: [],
        should_block: false,
      }, 403, req);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawBody = await req.json();
    
    // Validar con Zod schema
    const validationResult = fraudCheckSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return json({ 
        error: `Validación de datos fallida: ${errors}`,
        is_suspicious: false,
        risk_level: 'low',
        flags: [],
        should_block: false,
      }, 400, req);
    }
    
    const body: FraudCheckRequest = validationResult.data as FraudCheckRequest;

    const { emisor_documento, beneficiario_telefono, principal_dop, origin_ip } = body;

    const flags: string[] = [];
    let risk_level: 'low' | 'medium' | 'high' = 'low';

    const now = new Date();
    const today_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hour_ago = new Date(now.getTime() - 60 * 60 * 1000);
    const month_start = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check 1: Daily transaction count per sender
    if (emisor_documento) {
      const { data: daily_txs, error: e1 } = await supabaseClient
        .from('remittances')
        .select('id')
        .eq('emisor_documento', emisor_documento)
        .gte('created_at', today_start.toISOString())
        .not('state', 'eq', 'FAILED');

      if (e1) throw e1;

      if (daily_txs && daily_txs.length >= LIMITS.MAX_DAILY_TRANSACTIONS_PER_SENDER) {
        flags.push(`Límite diario de transacciones excedido: ${daily_txs.length}`);
        risk_level = 'high';
      }

      // Check 2: Daily amount per sender
      const { data: daily_amounts, error: e2 } = await supabaseClient
        .from('remittances')
        .select('principal_dop')
        .eq('emisor_documento', emisor_documento)
        .gte('created_at', today_start.toISOString())
        .not('state', 'eq', 'FAILED');

      if (e2) throw e2;

      const daily_total = (daily_amounts || []).reduce((sum, tx) => sum + (tx.principal_dop || 0), 0);
      if (daily_total + principal_dop > LIMITS.MAX_DAILY_AMOUNT_PER_SENDER_DOP) {
        flags.push(`Límite diario de monto excedido: ${daily_total.toFixed(2)} DOP`);
        risk_level = 'high';
      }

      // Check 3: Monthly amount per sender
      const { data: monthly_amounts, error: e3 } = await supabaseClient
        .from('remittances')
        .select('principal_dop')
        .eq('emisor_documento', emisor_documento)
        .gte('created_at', month_start.toISOString())
        .not('state', 'eq', 'FAILED');

      if (e3) throw e3;

      const monthly_total = (monthly_amounts || []).reduce((sum, tx) => sum + (tx.principal_dop || 0), 0);
      if (monthly_total + principal_dop > LIMITS.MAX_MONTHLY_AMOUNT_PER_SENDER_DOP) {
        flags.push(`Límite mensual de monto excedido: ${monthly_total.toFixed(2)} DOP`);
        risk_level = 'high';
      }

      // Check 4: Transaction velocity (transactions per hour)
      const { data: hourly_txs, error: e4 } = await supabaseClient
        .from('remittances')
        .select('id')
        .eq('emisor_documento', emisor_documento)
        .gte('created_at', hour_ago.toISOString())
        .not('state', 'eq', 'FAILED');

      if (e4) throw e4;

      if (hourly_txs && hourly_txs.length >= LIMITS.MAX_VELOCITY_TRANSACTIONS_PER_HOUR) {
        flags.push(`Velocidad sospechosa: ${hourly_txs.length} transacciones en 1 hora`);
        risk_level = risk_level === 'high' ? 'high' : 'medium';
      }

      // Check 5: Time between transactions
      const { data: latest_tx, error: e5 } = await supabaseClient
        .from('remittances')
        .select('created_at')
        .eq('emisor_documento', emisor_documento)
        .order('created_at', { ascending: false })
        .limit(1);

      if (e5) throw e5;

      if (latest_tx && latest_tx.length > 0) {
        const last_tx_time = new Date(latest_tx[0].created_at);
        const minutes_diff = (now.getTime() - last_tx_time.getTime()) / (1000 * 60);
        if (minutes_diff < LIMITS.MIN_TIME_BETWEEN_TRANSACTIONS_MINUTES) {
          flags.push(`Transacción demasiado rápida: ${minutes_diff.toFixed(1)} minutos desde última`);
          risk_level = risk_level === 'high' ? 'high' : 'medium';
        }
      }
    }

    // Check 6: Same beneficiary repetition
    if (beneficiario_telefono && emisor_documento) {
      const { data: same_ben_txs, error: e6 } = await supabaseClient
        .from('remittances')
        .select('id')
        .eq('emisor_documento', emisor_documento)
        .eq('beneficiario_telefono', beneficiario_telefono)
        .gte('created_at', today_start.toISOString())
        .not('state', 'eq', 'FAILED');

      if (e6) throw e6;

      if (same_ben_txs && same_ben_txs.length >= LIMITS.MAX_TRANSACTIONS_SAME_BENEFICIARY_DAILY) {
        flags.push(`Mismo beneficiario repetido: ${same_ben_txs.length} veces hoy`);
        risk_level = risk_level === 'high' ? 'high' : 'medium';
      }
    }

    // Check 7: Suspicious round amounts
    if (principal_dop >= LIMITS.SUSPICIOUS_ROUND_AMOUNT_THRESHOLD && principal_dop % 10000 === 0) {
      flags.push(`Monto redondo sospechoso: ${principal_dop} DOP`);
      risk_level = risk_level === 'high' ? 'high' : 'medium';
    }

    // Check 8: IP-based velocity
    if (origin_ip) {
      const { data: ip_txs, error: e8 } = await supabaseClient
        .from('remittances')
        .select('id')
        .eq('origin_ip', origin_ip)
        .gte('created_at', hour_ago.toISOString())
        .not('state', 'eq', 'FAILED');

      if (e8) throw e8;

      if (ip_txs && ip_txs.length >= LIMITS.MAX_VELOCITY_TRANSACTIONS_PER_HOUR) {
        flags.push(`IP sospechosa: ${ip_txs.length} transacciones en 1 hora`);
        risk_level = 'high';
      }
    }

    const response: FraudCheckResponse = {
      is_suspicious: flags.length > 0,
      risk_level,
      flags,
      should_block: risk_level === 'high',
    };

    // Log audit trail for suspicious activity
    if (response.is_suspicious) {
      await supabaseClient.from('audit_log').insert({
        entity: 'fraud_detection',
        action: 'FRAUD_CHECK',
        details: {
          emisor_documento,
          beneficiario_telefono,
          principal_dop,
          risk_level,
          flags,
        },
        ip: origin_ip,
      });
    }

    return json(response, 200, req)

  } catch (error) {
    console.error('Fraud detection error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Error en detección de fraude',
      is_suspicious: false,
      risk_level: 'low',
      flags: [],
      should_block: false,
    }, 500, req);
  }
});
