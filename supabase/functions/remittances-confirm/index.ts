import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmRemittanceRequest {
  remittance_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { remittance_id }: ConfirmRemittanceRequest = await req.json();

    if (!remittance_id) {
      return new Response(
        JSON.stringify({ error: 'ID de remesa requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Confirming remittance:', { remittance_id, user_id: user.id });

    // Obtener la remesa
    const { data: remittance, error: fetchError } = await supabaseClient
      .from('remittances')
      .select('*, agents!inner(float_balance_dop, owner_user_id)')
      .eq('id', remittance_id)
      .single();

    if (fetchError || !remittance) {
      console.error('Error fetching remittance:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Remesa no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos
    if (remittance.agente_id !== user.id) {
      const { data: userRoles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(r => r.role === 'admin') ?? false;
      
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'No tiene permisos para confirmar esta remesa' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validar estado
    if (remittance.state !== 'QUOTED' && remittance.state !== 'CREATED') {
      return new Response(
        JSON.stringify({ 
          error: `No se puede confirmar remesa en estado ${remittance.state}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar saldo disponible en la tienda
    const agent = remittance.agents;
    if (!agent || agent.float_balance_dop < remittance.principal_dop) {
      console.error('Insufficient balance:', {
        available: agent?.float_balance_dop,
        required: remittance.principal_dop,
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Saldo insuficiente en la tienda',
          available: agent?.float_balance_dop || 0,
          required: remittance.principal_dop,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Debitar float de la tienda
    const newBalance = agent.float_balance_dop - remittance.principal_dop;
    
    const { error: updateBalanceError } = await supabaseClient
      .from('agents')
      .update({ float_balance_dop: newBalance })
      .eq('id', remittance.agent_id);

    if (updateBalanceError) {
      console.error('Error updating agent balance:', updateBalanceError);
      return new Response(
        JSON.stringify({ error: 'Error al actualizar saldo de tienda' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar estado de la remesa a CONFIRMED
    const { data: updatedRemittance, error: updateError } = await supabaseClient
      .from('remittances')
      .update({
        state: 'CONFIRMED',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', remittance_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating remittance:', updateError);
      
      // Revertir el débito del float
      await supabaseClient
        .from('agents')
        .update({ float_balance_dop: agent.float_balance_dop })
        .eq('id', remittance.agent_id);
      
      return new Response(
        JSON.stringify({ error: 'Error al confirmar remesa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear evento de confirmación
    await supabaseClient
      .from('remittance_events')
      .insert({
        remittance_id: remittance.id,
        event: 'CONFIRMED',
        actor_type: 'USER',
        actor_id: user.id,
        meta: {
          previous_balance: agent.float_balance_dop,
          new_balance: newBalance,
          amount_debited: remittance.principal_dop,
        },
      });

    // Crear asientos contables (doble entrada)
    const entry_at = new Date().toISOString();
    
    // Buscar cuentas del ledger
    const { data: agentCashAccount } = await supabaseClient
      .from('ledger_accounts')
      .select('id')
      .eq('code', 'AGENT_CASH')
      .eq('agent_id', remittance.agent_id)
      .single();

    const { data: platformLiabilityAccount } = await supabaseClient
      .from('ledger_accounts')
      .select('id')
      .eq('code', 'PLATFORM_LIABILITY')
      .is('agent_id', null)
      .single();

    if (agentCashAccount && platformLiabilityAccount) {
      // Débito: AGENT_CASH (disminuye saldo del agente)
      // Crédito: PLATFORM_LIABILITY (aumenta pasivo con payout partner)
      await supabaseClient
        .from('ledger_entries')
        .insert({
          txn_id: remittance.id,
          entry_at,
          debit_account: platformLiabilityAccount.id,
          credit_account: agentCashAccount.id,
          amount: remittance.principal_dop,
          currency: 'DOP',
          memo: `Confirmación remesa ${remittance.codigo_referencia}`,
          created_by: user.id,
        });
    }

    console.log('Remittance confirmed successfully:', {
      id: remittance.id,
      new_balance: newBalance,
    });

    // TODO: Aquí se debería enviar la transacción al payout network (MonCash/SPIH)
    // Por ahora solo actualizamos el estado a SENT
    await supabaseClient
      .from('remittances')
      .update({
        state: 'SENT',
        sent_at: new Date().toISOString(),
      })
      .eq('id', remittance_id);

    await supabaseClient
      .from('remittance_events')
      .insert({
        remittance_id: remittance.id,
        event: 'SENT',
        actor_type: 'SYSTEM',
        meta: {
          channel: remittance.channel,
          payout_network: remittance.payout_network,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        remittance: {
          id: updatedRemittance.id,
          codigo_referencia: updatedRemittance.codigo_referencia,
          state: 'SENT', // Estado actualizado
          confirmed_at: updatedRemittance.confirmed_at,
          agent_balance_after: newBalance,
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
