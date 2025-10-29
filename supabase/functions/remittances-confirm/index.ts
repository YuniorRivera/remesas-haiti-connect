import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { checkRateLimit } from '../_shared/rateLimiter.ts'
import { preflight, json } from '../_shared/security.ts'

interface ConfirmRemittanceRequest {
  remittance_id: string;
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
      return json({ error: 'CSRF token inválido' }, 403, req)
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

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return json({ error: 'No autorizado' }, 401, req)
    }

    const requestData: ConfirmRemittanceRequest = await req.json();

    console.log('Confirming remittance:', { 
      user_id: user.id, 
      remittance_id: requestData.remittance_id 
    });

    // Obtener la remesa
    const { data: remittance, error: fetchError } = await supabaseClient
      .from('remittances')
      .select('*, agents!agent_id(id, float_balance_dop, trade_name)')
      .eq('id', requestData.remittance_id)
      .single();

    if (fetchError || !remittance) {
      console.error('Error fetching remittance:', fetchError);
      return json({ error: 'Remesa no encontrada' }, 404, req)
    }

    // Validar que la remesa esté en estado QUOTED
    if (remittance.state !== 'QUOTED') {
      return json({ error: `Remesa no está en estado QUOTED (actual: ${remittance.state})` }, 400, req)
    }

    // Validar que el usuario sea el agente de la remesa o admin
    if (remittance.agente_id !== user.id) {
      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(r => r.role === 'admin') ?? false;
      
      if (!isAdmin) {
        return json({ error: 'No autorizado para confirmar esta remesa' }, 403, req)
      }
    }

    // Verificar que el agente tiene float suficiente
    const agent = remittance.agents as any;
    const floatNeeded = remittance.total_client_pays_dop || 0;
    const currentFloat = agent?.float_balance_dop || 0;

    if (currentFloat < floatNeeded) {
      console.error('Insufficient float:', { currentFloat, floatNeeded });
      return json({ 
        error: 'Float insuficiente en la tienda',
        details: {
          current: currentFloat,
          needed: floatNeeded,
          shortage: floatNeeded - currentFloat
        }
      }, 400, req)
    }

    // Rate limit confirmations: 15 por 10m por agente/IP
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateKey = `confirm:${user.id}:${clientIp}`;
    const rl = checkRateLimit(rateKey, { windowMs: 10 * 60 * 1000, maxRequests: 15 });
    if (!rl.allowed) {
      return json({ error: 'Demasiadas confirmaciones recientes. Intenta más tarde.' }, { status: 429, headers: {
        'X-RateLimit-Limit': '15',
        'X-RateLimit-Remaining': rl.remaining.toString(),
        'X-RateLimit-Reset': new Date(rl.resetAt).toISOString(),
      }})
    }

    // Generar receipt_hash para QR
    const receiptData = {
      id: remittance.id,
      ref: remittance.codigo_referencia,
      amount: remittance.htg_to_beneficiary,
      timestamp: Date.now()
    };
    const receiptString = JSON.stringify(receiptData);
    const encoder = new TextEncoder();
    const data = encoder.encode(receiptString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const receipt_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Obtener/Crear cuentas de ledger necesarias usando service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cuenta de efectivo de la tienda (debe existir)
    let { data: agentCashAccount } = await supabaseAdmin
      .from('ledger_accounts')
      .select('id')
      .eq('code', `AGENT_CASH_${agent.id}`)
      .eq('currency', 'DOP')
      .maybeSingle();

    if (!agentCashAccount) {
      const { data: newAccount, error: createError } = await supabaseAdmin
        .from('ledger_accounts')
        .insert({
          code: `AGENT_CASH_${agent.id}`,
          name: `Efectivo Tienda ${agent.trade_name || agent.id}`,
          currency: 'DOP',
          agent_id: agent.id,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating agent cash account:', createError);
        return new Response(
          JSON.stringify({ error: 'Error creando cuenta de ledger' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      agentCashAccount = newAccount;
    }

    // Cuenta de remesas pendientes de pago (pasivo)
    let { data: pendingPayoutsAccount } = await supabaseAdmin
      .from('ledger_accounts')
      .select('id')
      .eq('code', 'PENDING_PAYOUTS_HTG')
      .eq('currency', 'HTG')
      .maybeSingle();

    if (!pendingPayoutsAccount) {
      const { data: newAccount, error: createError } = await supabaseAdmin
        .from('ledger_accounts')
        .insert({
          code: 'PENDING_PAYOUTS_HTG',
          name: 'Pagos Pendientes HTG',
          currency: 'HTG',
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating pending payouts account:', createError);
        return json({ error: 'Error creando cuenta de ledger' }, 500, req)
      }
      pendingPayoutsAccount = newAccount;
    }

    // Cuenta de ingresos por comisiones
    let { data: commissionRevenueAccount } = await supabaseAdmin
      .from('ledger_accounts')
      .select('id')
      .eq('code', 'REVENUE_COMMISSION_DOP')
      .eq('currency', 'DOP')
      .maybeSingle();

    if (!commissionRevenueAccount) {
      const { data: newAccount, error: createError } = await supabaseAdmin
        .from('ledger_accounts')
        .insert({
          code: 'REVENUE_COMMISSION_DOP',
          name: 'Ingresos por Comisiones DOP',
          currency: 'DOP',
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating commission revenue account:', createError);
        return json({ error: 'Error creando cuenta de ledger' }, 500, req)
      }
      commissionRevenueAccount = newAccount;
    }

    // Actualizar float de la tienda
    const { error: floatError } = await supabaseAdmin
      .from('agents')
      .update({ 
        float_balance_dop: currentFloat - floatNeeded 
      })
      .eq('id', agent.id);

    if (floatError) {
      console.error('Error updating float:', floatError);
      return json({ error: 'Error actualizando float de la tienda' }, 500, req)
    }

    // Verificar que las cuentas existan
    if (!agentCashAccount || !pendingPayoutsAccount || !commissionRevenueAccount) {
      return json({ error: 'Error: cuentas de ledger no encontradas' }, 500, req)
    }

    // Crear asientos de ledger con estructura correcta de doble partida
    const now = new Date().toISOString();
    const ledgerEntries = [
      // 1. Principal: Crédito en efectivo del agente (salida) -> Débito en pasivo pendiente
      {
        txn_id: remittance.id,
        debit_account: pendingPayoutsAccount.id,
        credit_account: agentCashAccount.id,
        amount: remittance.principal_dop,
        currency: 'DOP',
        memo: `Principal remesa ${remittance.codigo_referencia}`,
        entry_at: now,
        created_by: user.id,
      },
      // 2. Comisión del agente: Crédito en efectivo -> Débito en ingresos
      {
        txn_id: remittance.id,
        debit_account: commissionRevenueAccount.id,
        credit_account: agentCashAccount.id,
        amount: remittance.comision_agente || 0,
        currency: 'DOP',
        memo: `Comisión agente ${remittance.codigo_referencia}`,
        entry_at: now,
        created_by: user.id,
      },
    ];

    // Insertar entries (simplificado - en producción debería ser una transacción atómica)
    const { error: ledgerError } = await supabaseAdmin
      .from('ledger_entries')
      .insert(ledgerEntries);

    if (ledgerError) {
      console.error('Error creating ledger entries:', ledgerError);
      // Revertir float
      await supabaseAdmin
        .from('agents')
        .update({ float_balance_dop: currentFloat })
        .eq('id', agent.id);
      
      return json({ error: 'Error creando asientos contables' }, 500, req)
    }

    // Actualizar remesa a CONFIRMED
    const { data: updatedRemittance, error: updateError } = await supabaseClient
      .from('remittances')
      .update({
        state: 'CONFIRMED',
        estado: 'confirmada',
        confirmed_at: now,
        receipt_hash,
      })
      .eq('id', remittance.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating remittance:', updateError);
      return json({ error: 'Error confirmando remesa' }, 500, req)
    }

    // Crear evento de auditoría
    await supabaseClient
      .from('remittance_events')
      .insert({
        remittance_id: remittance.id,
        event: 'CONFIRMED',
        actor_type: 'USER',
        actor_id: user.id,
        meta: {
          receipt_hash,
          float_debited: floatNeeded,
          ledger_entries_created: ledgerEntries.length,
        },
      });

    console.log('Remittance confirmed successfully');

    return json({
      success: true,
      remittance: {
        id: updatedRemittance.id,
        codigo_referencia: updatedRemittance.codigo_referencia,
        state: updatedRemittance.state,
        receipt_hash: updatedRemittance.receipt_hash,
        confirmed_at: updatedRemittance.confirmed_at,
      },
    }, 200, req)
  } catch (error) {
    console.error('Error in remittances-confirm function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return json({ error: 'Error interno del servidor', details: errorMessage }, 500, req)
  }
});
