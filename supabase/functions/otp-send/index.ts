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

    const { user_id, method } = await req.json();

    if (!user_id || !method || !['sms', 'email'].includes(method)) {
      return json({ error: 'Invalid parameters' }, 400, req);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('phone, full_name')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return json({ error: 'User not found' }, 404, req);
    }

    // Get user email
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (authError || !authUser.user.email) {
      return json({ error: 'User email not found' }, 404, req);
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    const { error: insertError } = await supabaseClient
      .from('otp_codes')
      .insert({
        user_id,
        code: otpCode,
        method,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return json({ error: 'Failed to generate OTP' }, 500, req);
    }

    // Send OTP via the notify service
    const recipient = method === 'sms' ? profile.phone : authUser.user.email;
    
    if (!recipient) {
      return json({ error: `${method === 'sms' ? 'Phone' : 'Email'} not found` }, 400, req);
    }

    // Invoke notification service
    try {
      const { error: notifyError } = await supabaseClient.functions.invoke('notify', {
        body: {
          event: 'OTP_SENT',
          channels: [method],
          language: 'es',
          to: {
            [method]: recipient,
          },
          variables: {
            name: profile.full_name || 'Usuario',
            code: otpCode,
            expiry: '10 minutos',
          },
        },
      });

      if (notifyError) {
        console.error('Error sending OTP notification:', notifyError);
        // Don't fail the request, OTP is already stored
      }
    } catch (error) {
      console.error('Error invoking notify function:', error);
    }

    return json({ success: true, message: `OTP sent via ${method}` }, 200, req);
  } catch (error) {
    console.error('Error in otp-send:', error);
    return json({ error: 'Internal server error' }, 500, req);
  }
});

