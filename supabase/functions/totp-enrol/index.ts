import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple TOTP secret generation (in production, use proper crypto library)
function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function generateQRCodeURL(secret: string, email: string): string {
  const issuer = encodeURIComponent('kobcash');
  const account = encodeURIComponent(email);
  const url = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
  return url;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    // Feature flag check
    if (Deno.env.get('ENABLE_TOTP') !== 'true') {
      return json({ error: 'TOTP functionality is disabled' }, 403, req);
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

    const { user_id } = await req.json();

    if (!user_id) {
      return json({ error: 'User ID required' }, 400, req);
    }

    // Get user email
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (authError || !authUser.user.email) {
      return json({ error: 'User not found' }, 404, req);
    }

    // Check if user already has a verified TOTP
    const { data: existingTOTP } = await supabaseClient
      .from('totp_enrollments')
      .select('*')
      .eq('user_id', user_id)
      .eq('verified', true)
      .maybeSingle();

    if (existingTOTP) {
      return json({ error: 'TOTP already enrolled and verified' }, 400, req);
    }

    // Generate new TOTP secret
    const secret = generateTOTPSecret();
    const qrCodeURL = generateQRCodeURL(secret, authUser.user.email);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store enrollment in database
    const { data: enrollment, error: insertError } = await supabaseClient
      .from('totp_enrollments')
      .insert({
        user_id,
        secret,
        backup_codes: backupCodes,
        verified: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing TOTP enrollment:', insertError);
      return json({ error: 'Failed to create TOTP enrollment' }, 500, req);
    }

    return json({ 
      success: true,
      secret,
      qr_code_url: qrCodeURL,
      backup_codes: backupCodes,
      enrollment_id: enrollment.id,
    }, 200, req);
  } catch (error) {
    console.error('Error in totp-enrol:', error);
    return json({ error: 'Internal server error' }, 500, req);
  }
});

