import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
};

interface CreateRemittanceRequest {
  emisor_nombre: string;
  emisor_telefono?: string;
  emisor_documento?: string;
  beneficiario_nombre: string;
  beneficiario_telefono?: string;
  beneficiario_documento?: string;
  principal_dop: number;
  channel: 'MONCASH' | 'SPIH';
  payout_network?: string;
  payout_city?: string;
  origin_terminal_id?: string;
  origin_ip?: string;
  origin_device_fingerprint?: string;
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

    // Verificar que el usuario sea agente
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAgent = userRoles?.some(r => 
      ['agent_owner', 'agent_clerk', 'admin'].includes(r.role)
    ) ?? false;

    if (!isAgent) {
      return new Response(
        JSON.stringify({ error: 'Solo agentes pueden crear remesas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener datos del agente
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('agent_id')
      .eq('id', user.id)
      .single();

    if (!profile?.agent_id) {
      return new Response(
        JSON.stringify({ error: 'Usuario no tiene tienda asignada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: CreateRemittanceRequest = await req.json();

    console.log('Creating remittance:', { 
      user_id: user.id, 
      agent_id: profile.agent_id,
      principal_dop: requestData.principal_dop,
      channel: requestData.channel
    });

    // Validar input
    if (!requestData.emisor_nombre || !requestData.beneficiario_nombre) {
      return new Response(
        JSON.stringify({ error: 'Emisor y beneficiario son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.principal_dop || requestData.principal_dop <= 0) {
      return new Response(
        JSON.stringify({ error: 'Monto principal inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener cotización del motor de precios
    const { data: quoteData, error: quoteError } = await supabaseClient.functions.invoke(
      'pricing-quote',
      {
        body: {
          principal_dop: requestData.principal_dop,
          channel: requestData.channel,
        },
      }
    );

    if (quoteError || !quoteData) {
      console.error('Error getting quote:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener cotización', details: quoteError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Quote received for remittance');

    // Generar código de referencia único
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigo_referencia = `REM-${timestamp}-${random}`;

    // Crear remesa en estado QUOTED
    const { data: remittance, error: createError } = await supabaseClient
      .from('remittances')
      .insert({
        codigo_referencia,
        emisor_nombre: requestData.emisor_nombre,
        emisor_telefono: requestData.emisor_telefono,
        emisor_documento: requestData.emisor_documento,
        emisor_id: user.id,
        beneficiario_nombre: requestData.beneficiario_nombre,
        beneficiario_telefono: requestData.beneficiario_telefono,
        beneficiario_documento: requestData.beneficiario_documento,
        principal_dop: requestData.principal_dop,
        channel: requestData.channel,
        agent_id: profile.agent_id,
        agente_id: user.id,
        state: 'QUOTED',
        
        // Datos de la cotización
        fx_mid_dop_htg: quoteData.fx_mid_dop_htg || quoteData.fx_client_sell,
        fx_client_sell: quoteData.fx_client_sell,
        htg_before_partner: quoteData.htg_before_partner,
        partner_fee_htg: quoteData.partner_fee_htg,
        htg_to_beneficiary: quoteData.htg_to_beneficiary,
        client_fee_fixed_dop: quoteData.client_fee_fixed_dop,
        client_fee_pct_dop: quoteData.client_fee_pct_dop,
        acquiring_cost_dop: quoteData.acquiring_cost_dop,
        gov_fee_dop: quoteData.gov_fee_dop,
        total_client_fees_dop: quoteData.total_client_fees_dop,
        total_client_pays_dop: quoteData.total_client_pays_dop,
        comision_agente: quoteData.store_commission_dop,
        
        // Admin-only fields (si están disponibles)
        platform_commission_dop: quoteData.platform_commission_dop,
        fx_spread_rev_dop: quoteData.fx_spread_rev_dop,
        partner_cost_dop_equiv: quoteData.partner_cost_dop_equiv,
        margen_plataforma: quoteData.platform_gross_margin_dop,
        
        // Datos de origen
        origin_terminal_id: requestData.origin_terminal_id,
        origin_cashier_user: user.id,
        origin_ip: requestData.origin_ip,
        origin_device_fingerprint: requestData.origin_device_fingerprint,
        
        // Datos de destino
        payout_network: requestData.payout_network,
        payout_country: 'HT',
        payout_city: requestData.payout_city,
        
        quoted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating remittance:', createError);
      return new Response(
        JSON.stringify({ error: 'Error al crear remesa', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear evento de auditoría
    await supabaseClient
      .from('remittance_events')
      .insert({
        remittance_id: remittance.id,
        event: 'QUOTED',
        actor_type: 'USER',
        actor_id: user.id,
        meta: {
          quote: quoteData,
          request: requestData,
        },
      });

    console.log('Remittance created successfully:', remittance.id);

    return new Response(
      JSON.stringify({
        success: true,
        remittance: {
          id: remittance.id,
          codigo_referencia: remittance.codigo_referencia,
          state: remittance.state,
          principal_dop: remittance.principal_dop,
          htg_to_beneficiary: remittance.htg_to_beneficiary,
          total_client_pays_dop: remittance.total_client_pays_dop,
          fx_client_sell: remittance.fx_client_sell,
          client_fee_fixed_dop: remittance.client_fee_fixed_dop,
          client_fee_pct_dop: remittance.client_fee_pct_dop,
          total_client_fees_dop: remittance.total_client_fees_dop,
          gov_fee_dop: remittance.gov_fee_dop,
          store_commission_dop: remittance.comision_agente,
          quoted_at: remittance.quoted_at,
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in remittances-create function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
