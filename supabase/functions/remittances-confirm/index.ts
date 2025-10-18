import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
};

interface ConfirmRemittanceRequest {
  remittance_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar CSRF token
    const csrfToken = req.headers.get('X-CSRF-Token');
    const csrfCookie = req.headers.get('Cookie')?.split(';')
      .find(c => c.trim().startsWith('csrf-token='))
      ?.split('=')[1];

    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      console.error('CSRF validation failed');
      return new Response(
        JSON.stringify({ error: 'CSRF token inválido' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Remesa no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar que la remesa esté en estado QUOTED
    if (remittance.state !== 'QUOTED') {
      return new Response(
        JSON.stringify({ error: `Remesa no está en estado QUOTED (actual: ${remittance.state})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar que el usuario sea el agente de la remesa o admin
    if (remittance.agente_id !== user.id) {
      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(r => r.role === 'admin') ?? false;
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'No autorizado para confirmar esta remesa' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar que el agente tiene float suficiente
    const agent = remittance.agents as any;
    const floatNeeded = remittance.total_client_pays_dop || 0;
    const currentFloat = agent?.float_balance_dop || 0;

    if (currentFloat < floatNeeded) {
      console.error('Insufficient float:', { currentFloat, floatNeeded });
      return new Response(
        JSON.stringify({ 
          error: 'Float insuficiente en la tienda',
          details: {
            current: currentFloat,
            needed: floatNeeded,
            shortage: floatNeeded - currentFloat
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        return new Response(
          JSON.stringify({ error: 'Error creando cuenta de ledger' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        return new Response(
          JSON.stringify({ error: 'Error creando cuenta de ledger' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      return new Response(
        JSON.stringify({ error: 'Error actualizando float de la tienda' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que las cuentas existan
    if (!agentCashAccount || !pendingPayoutsAccount || !commissionRevenueAccount) {
      return new Response(
        JSON.stringify({ error: 'Error: cuentas de ledger no encontradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      
      return new Response(
        JSON.stringify({ error: 'Error creando asientos contables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Error confirmando remesa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        remittance: {
          id: updatedRemittance.id,
          codigo_referencia: updatedRemittance.codigo_referencia,
          state: updatedRemittance.state,
          receipt_hash: updatedRemittance.receipt_hash,
          confirmed_at: updatedRemittance.confirmed_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in remittances-confirm function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
