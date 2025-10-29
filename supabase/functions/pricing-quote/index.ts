import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts'

interface QuoteRequest {
  principal_dop: number;
  channel: 'MONCASH' | 'SPIH';
}

interface FeesMatrix {
  fixed_fee_dop: number;
  percent_fee_client: number;
  spread_bps: number;
  acquiring_dop: number;
  gov_fee_usd: number;
  partner_fee_flat_htg: number;
  partner_fee_percent: number;
  min_partner_fee_htg: number;
  store_commission_pct: number;
  platform_commission_pct: number;
  fx_dop_htg_mid: number;
  fx_usd_dop: number;
}

Deno.serve(async (req) => {
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
      return json({ error: 'CSRF token inválido' }, 403, req);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return json({ error: 'No autorizado' }, 401, req)
    }

    // Verificar rol del usuario
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin') ?? false;

    // Parsear request
    const { principal_dop, channel }: QuoteRequest = await req.json();

    console.log('Quote request:', { principal_dop, channel, user_id: user.id });

    // Validar input
    if (!principal_dop || principal_dop <= 0) {
      return json({ error: 'Monto principal inválido' }, 400, req)
    }

    if (!channel || !['MONCASH', 'SPIH'].includes(channel)) {
      return json({ error: 'Canal inválido. Use MONCASH o SPIH' }, 400, req)
    }

    // Leer fees_matrix activa para RD→HT y el canal especificado
    const { data: feesData, error: feesError } = await supabaseClient
      .from('fees_matrix')
      .select('*')
      .eq('corridor', 'RD->HT')
      .eq('channel', channel)
      .eq('is_active', true)
      .single();

    if (feesError || !feesData) {
      console.error('Error fetching fees matrix:', feesError);
      return json({ error: 'No se encontró configuración de tarifas activa para este canal' }, 404, req)
    }

    const fees: FeesMatrix = feesData;

    console.log('Fees matrix loaded:', fees);

    // === CÁLCULOS ===

    // 1. Tasas de cambio
    const fx_mid_dop_htg = fees.fx_dop_htg_mid;
    const fx_client_sell = fx_mid_dop_htg * (1 - fees.spread_bps / 10000);

    // 2. Fees al cliente
    const client_fee_fixed_dop = fees.fixed_fee_dop;
    const client_fee_pct_dop = principal_dop * fees.percent_fee_client;
    const total_client_fees_dop = client_fee_fixed_dop + client_fee_pct_dop;
    const total_client_pays_dop = principal_dop + total_client_fees_dop;

    // 3. Fee gubernamental BRH (1.50 USD por transferencia a Haití)
    const gov_fee_dop = fees.gov_fee_usd * fees.fx_usd_dop;

    // 4. Conversión a HTG antes de partner fee
    const htg_before_partner = principal_dop * fx_client_sell;

    // 5. Partner fee en HTG
    const partner_fee_flat_htg = fees.partner_fee_flat_htg;
    const partner_fee_pct_htg = htg_before_partner * fees.partner_fee_percent;
    const partner_fee_htg = Math.max(
      partner_fee_flat_htg + partner_fee_pct_htg,
      fees.min_partner_fee_htg
    );

    // 6. Monto neto que recibe el beneficiario
    const htg_to_beneficiary = htg_before_partner - partner_fee_htg;

    // 7. Partner cost en DOP equivalente (para P&L)
    const partner_cost_dop_equiv = partner_fee_htg / fx_mid_dop_htg;

    // 8. Costo de adquirencia
    const acquiring_cost_dop = fees.acquiring_dop;

    // 9. Comisión de la tienda (visible para agentes)
    const store_commission_dop = total_client_fees_dop * fees.store_commission_pct;

    // 10. Ingreso por spread FX
    const fx_spread_rev_dop = principal_dop * (fx_mid_dop_htg - fx_client_sell);

    // 11. Ingresos totales de la plataforma
    const total_platform_revenue = total_client_fees_dop + fx_spread_rev_dop;

    // 12. Costos totales
    const total_costs = partner_cost_dop_equiv + gov_fee_dop + acquiring_cost_dop + store_commission_dop;

    // 13. Margen bruto de la plataforma (admin-only)
    const platform_gross_margin_dop = total_platform_revenue - total_costs;
    const platform_commission_dop = total_client_fees_dop * fees.platform_commission_pct;

    console.log('Calculation results:', {
      total_platform_revenue,
      total_costs,
      platform_gross_margin_dop,
      profitable: platform_gross_margin_dop > 0,
    });

    // === REGLA DE BLOQUEO ===
    // Si los costos son >= a los ingresos, rechazar la cotización
    if (total_costs >= total_platform_revenue) {
      console.warn('Quote rejected: costs >= revenue', {
        total_costs,
        total_platform_revenue,
        deficit: total_costs - total_platform_revenue,
      });

      return json({
        error: 'Cotización rechazada: La transacción no es rentable con las tarifas actuales',
        details: isAdmin
          ? {
              total_costs,
              total_platform_revenue,
              deficit: total_costs - total_platform_revenue,
            }
          : undefined,
      }, 400, req)
    }

    // === RESPUESTA DIFERENCIADA POR ROL ===

    // Respuesta para Cliente/Tienda (datos visibles)
    const publicQuote = {
      principal_dop,
      channel,
      fx_client_sell,
      htg_to_beneficiary,
      client_fee_fixed_dop,
      client_fee_pct_dop,
      total_client_fees_dop,
      total_client_pays_dop,
      acquiring_cost_dop,
      gov_fee_dop, // BRH fee visible
      gov_fee_usd: fees.gov_fee_usd, // Mostrar el fee en USD también
      store_commission_dop, // Comisión de la tienda (visible)
      quoted_at: new Date().toISOString(),
    };

    // Respuesta completa para Admin (incluye márgenes y costos internos)
    const adminQuote = {
      ...publicQuote,
      fx_mid_dop_htg,
      fx_spread_bps: fees.spread_bps,
      fx_spread_rev_dop,
      htg_before_partner,
      partner_fee_htg,
      partner_cost_dop_equiv,
      platform_commission_dop,
      platform_gross_margin_dop,
      total_platform_revenue,
      total_costs,
      breakdown: {
        revenue: {
          client_fees: total_client_fees_dop,
          fx_spread: fx_spread_rev_dop,
          total: total_platform_revenue,
        },
        costs: {
          partner: partner_cost_dop_equiv,
          gov_brh: gov_fee_dop,
          acquiring: acquiring_cost_dop,
          store_commission: store_commission_dop,
          total: total_costs,
        },
        margin: platform_gross_margin_dop,
      },
    };

    const response = isAdmin ? adminQuote : publicQuote;

    console.log('Quote generated successfully for user:', user.id);

    return json(response, 200, req)
  } catch (error) {
    console.error('Error in pricing-quote function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return json({ error: 'Error interno del servidor', details: errorMessage }, 500, req)
  }
});
