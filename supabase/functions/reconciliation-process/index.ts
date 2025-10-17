import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationItem {
  reference_code?: string;
  amount: number;
  date: string;
  transaction_id?: string;
}

interface ReconciliationPayload {
  source: 'BANK' | 'PAYOUT';
  data: ReconciliationItem[];
  file_ref?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que sea admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: ReconciliationPayload = await req.json();

    console.log('Processing reconciliation:', { source: payload.source, items: payload.data.length });

    // Obtener remesas del período
    const dates = payload.data.map(item => item.date);
    const minDate = dates.sort()[0];
    const maxDate = dates.sort()[dates.length - 1];

    const { data: remittances, error: remittancesError } = await supabaseClient
      .from('remittances')
      .select('id, codigo_referencia, total_client_pays_dop, principal_dop, created_at, state')
      .gte('created_at', minDate)
      .lte('created_at', maxDate);

    if (remittancesError) {
      console.error('Error fetching remittances:', remittancesError);
      throw new Error('Error al obtener remesas');
    }

    // Comparar datos
    const matched: any[] = [];
    const unmatched: any[] = [];
    let totalVariance = 0;

    for (const item of payload.data) {
      let found = false;

      if (item.reference_code) {
        const remittance = remittances?.find(r => r.codigo_referencia === item.reference_code);
        
        if (remittance) {
          const expectedAmount = payload.source === 'BANK' 
            ? parseFloat(remittance.total_client_pays_dop || '0')
            : parseFloat(remittance.principal_dop || '0');
          
          const variance = item.amount - expectedAmount;
          
          matched.push({
            external_ref: item.reference_code,
            internal_ref: remittance.codigo_referencia,
            external_amount: item.amount,
            internal_amount: expectedAmount,
            variance,
            date: item.date,
            remittance_id: remittance.id,
          });

          if (Math.abs(variance) > 0.01) {
            totalVariance += variance;
          }

          found = true;
        }
      }

      if (!found) {
        unmatched.push({
          reference: item.reference_code || item.transaction_id || 'N/A',
          amount: item.amount,
          date: item.date,
          type: 'external',
        });
      }
    }

    // Buscar remesas sin match
    const matchedIds = matched.map(m => m.remittance_id);
    const unmatchedRemittances = remittances?.filter(r => !matchedIds.includes(r.id)) || [];

    for (const r of unmatchedRemittances) {
      const amount = payload.source === 'BANK'
        ? parseFloat(r.total_client_pays_dop || '0')
        : parseFloat(r.principal_dop || '0');

      unmatched.push({
        reference: r.codigo_referencia,
        amount,
        date: r.created_at,
        type: 'internal',
        remittance_id: r.id,
      });

      totalVariance -= amount;
    }

    // Guardar reconciliación
    const { data: reconciliation, error: reconError } = await supabaseClient
      .from('reconciliations')
      .insert({
        source: payload.source,
        data_json: {
          matched,
          unmatched,
          summary: {
            total_items: payload.data.length,
            matched_count: matched.length,
            unmatched_count: unmatched.length,
            total_variance: totalVariance,
          },
        },
        variance_dop: totalVariance,
        file_ref: payload.file_ref,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        status: Math.abs(totalVariance) < 0.01 ? 'reconciled' : 'pending',
      })
      .select()
      .single();

    if (reconError) {
      console.error('Error saving reconciliation:', reconError);
      throw new Error('Error al guardar reconciliación');
    }

    // Registrar en audit log
    await supabaseClient
      .from('audit_log')
      .insert({
        actor_user_id: user.id,
        action: 'RECONCILIATION_PROCESSED',
        entity: 'reconciliation',
        entity_id: reconciliation.id,
        details: {
          source: payload.source,
          matched: matched.length,
          unmatched: unmatched.length,
          variance: totalVariance,
        },
      });

    console.log('Reconciliation completed:', {
      id: reconciliation.id,
      matched: matched.length,
      unmatched: unmatched.length,
      variance: totalVariance,
    });

    return new Response(
      JSON.stringify({
        success: true,
        reconciliation_id: reconciliation.id,
        summary: {
          matched: matched.length,
          unmatched: unmatched.length,
          variance: totalVariance,
          status: reconciliation.status,
        },
        details: {
          matched,
          unmatched,
        },
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in reconciliation-process:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error al procesar reconciliación', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
