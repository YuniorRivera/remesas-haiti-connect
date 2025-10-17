import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// Esquema de validación para el webhook payload
const PayoutWebhookSchema = z.object({
  reference_code: z.string().min(1, 'reference_code es requerido').max(50, 'reference_code muy largo'),
  status: z.enum(['PAID', 'FAILED', 'CASHOUT', 'SETTLED'], {
    errorMap: () => ({ message: 'status debe ser PAID, FAILED, CASHOUT o SETTLED' })
  }),
  transaction_id: z.string().max(100).optional(),
  paid_at: z.string().datetime().optional(),
  settled_at: z.string().datetime().optional(),
  failure_reason: z.string().max(500).optional(),
  payout_operator_id: z.string().max(50).optional(),
  payout_receipt_num: z.string().max(50).optional(),
  payout_lat: z.number().min(-90).max(90).optional(),
  payout_lon: z.number().min(-180).max(180).optional(),
  payout_address: z.string().max(500).optional(),
  payout_city: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

type PayoutWebhookPayload = z.infer<typeof PayoutWebhookSchema>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Crear cliente Supabase con service role para bypassear RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parsear y validar payload
    const rawPayload = await req.json();
    
    console.log('Payout webhook received:', rawPayload);

    let payload: PayoutWebhookPayload;
    try {
      payload = PayoutWebhookSchema.parse(rawPayload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return new Response(
          JSON.stringify({ 
            error: 'Datos de entrada inválidos',
            details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Buscar la remesa por código de referencia
    const { data: remittance, error: fetchError } = await supabaseClient
      .from('remittances')
      .select('*')
      .eq('codigo_referencia', payload.reference_code)
      .single();

    if (fetchError || !remittance) {
      console.error('Remittance not found:', payload.reference_code);
      return new Response(
        JSON.stringify({ error: 'Remesa no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing webhook for remittance:', remittance.id);

    // Preparar actualización según el estado
    const updates: Record<string, any> = {};
    let newState: string | undefined;

    switch (payload.status) {
      case 'PAID':
        newState = 'PAID';
        updates.paid_at = payload.paid_at || new Date().toISOString();
        updates.payout_receipt_num = payload.payout_receipt_num;
        updates.payout_operator_id = payload.payout_operator_id;
        
        // Actualizar geodatos si vienen
        if (payload.payout_lat) updates.payout_lat = payload.payout_lat;
        if (payload.payout_lon) updates.payout_lon = payload.payout_lon;
        if (payload.payout_address) updates.payout_address = payload.payout_address;
        if (payload.payout_city) updates.payout_city = payload.payout_city;
        break;

      case 'SETTLED':
        newState = 'PAID'; // Mantenemos PAID, solo actualizamos settled_at
        updates.settled_at = payload.settled_at || new Date().toISOString();
        break;

      case 'FAILED':
        newState = 'FAILED';
        updates.failed_at = new Date().toISOString();
        
        // Revertir débito del float de la tienda
        if (remittance.agent_id) {
          const { data: agent } = await supabaseClient
            .from('agents')
            .select('float_balance_dop')
            .eq('id', remittance.agent_id)
            .single();

          if (agent) {
            const refundedBalance = agent.float_balance_dop + remittance.principal_dop;
            await supabaseClient
              .from('agents')
              .update({ float_balance_dop: refundedBalance })
              .eq('id', remittance.agent_id);

            console.log('Float refunded to agent:', {
              agent_id: remittance.agent_id,
              amount: remittance.principal_dop,
              new_balance: refundedBalance,
            });
          }
        }
        break;

      case 'CASHOUT':
        // CASHOUT puede ser un estado intermedio antes de SETTLED
        // No cambiamos el state principal, solo registramos el evento
        break;

      default:
        console.warn('Unknown payout status:', payload.status);
    }

    // Actualizar la remesa
    if (newState) {
      updates.state = newState;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseClient
        .from('remittances')
        .update(updates)
        .eq('id', remittance.id);

      if (updateError) {
        console.error('Error updating remittance:', updateError);
        return new Response(
          JSON.stringify({ error: 'Error al actualizar remesa' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Crear evento de auditoría
    await supabaseClient
      .from('remittance_events')
      .insert({
        remittance_id: remittance.id,
        event: payload.status,
        actor_type: 'SYSTEM',
        actor_id: null,
        meta: {
          webhook_payload: payload,
          previous_state: remittance.state,
          new_state: newState || remittance.state,
        },
      });

    // Si es SETTLED, crear asiento contable final
    if (payload.status === 'SETTLED') {
      const { data: platformLiabilityAccount } = await supabaseClient
        .from('ledger_accounts')
        .select('id')
        .eq('code', 'PLATFORM_LIABILITY')
        .is('agent_id', null)
        .single();

      const { data: partnerPayableAccount } = await supabaseClient
        .from('ledger_accounts')
        .select('id')
        .eq('code', 'PARTNER_PAYABLE')
        .is('agent_id', null)
        .single();

      if (platformLiabilityAccount && partnerPayableAccount) {
        // Débito: PLATFORM_LIABILITY (reduce pasivo pendiente)
        // Crédito: PARTNER_PAYABLE (registra pago realizado al partner)
        await supabaseClient
          .from('ledger_entries')
          .insert({
            txn_id: remittance.id,
            entry_at: new Date().toISOString(),
            debit_account: platformLiabilityAccount.id,
            credit_account: partnerPayableAccount.id,
            amount: remittance.htg_to_beneficiary || remittance.principal_dop,
            currency: 'HTG',
            memo: `Settlement remesa ${remittance.codigo_referencia}`,
            created_by: null,
          });
      }
    }

    console.log('Webhook processed successfully:', {
      remittance_id: remittance.id,
      status: payload.status,
      new_state: newState,
    });

    return new Response(
      JSON.stringify({
        success: true,
        remittance_id: remittance.id,
        status: payload.status,
        processed_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in webhooks-payout function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
