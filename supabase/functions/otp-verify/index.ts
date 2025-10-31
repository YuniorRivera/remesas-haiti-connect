import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    // Feature flag check
    if (Deno.env.get('ENABLE_OTP') !== 'true') {
      return json({ error: 'OTP functionality is disabled' }, 403, req);
    }

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

    const { user_id, code } = await req.json();

    if (!user_id || !code) {
      return json({ error: 'Invalid parameters' }, 400, req);
    }

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabaseClient
      .from('otp_codes')
      .select('*')
      .eq('user_id', user_id)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      // Increment attempt count for failed attempts
      const { data: recentOtp } = await supabaseClient
        .from('otp_codes')
        .select('id, attempt_count')
        .eq('user_id', user_id)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentOtp && recentOtp.attempt_count < 5) {
        await supabaseClient
          .from('otp_codes')
          .update({ attempt_count: recentOtp.attempt_count + 1 })
          .eq('id', recentOtp.id);
      }

      return json({ 
        error: 'Invalid or expired OTP code',
        valid: false 
      }, 401, req);
    }

    // Mark OTP as used
    const { error: updateError } = await supabaseClient
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpData.id);

    if (updateError) {
      console.error('Error updating OTP:', updateError);
    }

    // Log successful verification
    await supabaseClient
      .from('audit_log')
      .insert({
        action: 'OTP_VERIFIED',
        entity: 'authentication',
        entity_id: user_id,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        details: {
          method: otpData.method,
        },
      });

    return json({ 
      success: true, 
      valid: true,
      method: otpData.method 
    }, 200, req);
  } catch (error) {
    console.error('Error in otp-verify:', error);
    return json({ error: 'Internal server error' }, 500, req);
  }
});

