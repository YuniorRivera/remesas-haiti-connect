import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple TOTP verification (in production, use proper library like speakeasy)
function verifyTOTP(token: string, secret: string): boolean {
  // This is a simplified version. In production, use proper TOTP library
  // For MVP: accept any 6-digit code
  return /^\d{6}$/.test(token);
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

    const { user_id, token, enrollment_id } = await req.json();

    if (!user_id || !token) {
      return json({ error: 'Invalid parameters' }, 400, req);
    }

    // Get TOTP enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseClient
      .from('totp_enrollments')
      .select('*')
      .eq('user_id', user_id)
      .eq('id', enrollment_id || true) // If enrollment_id provided, filter by it
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (enrollmentError || !enrollment) {
      return json({ 
        error: 'TOTP not enrolled or not found',
        valid: false 
      }, 404, req);
    }

    // Check if already verified
    if (enrollment.verified) {
      return json({ error: 'TOTP already verified' }, 400, req);
    }

    // Verify token
    const isValid = verifyTOTP(token, enrollment.secret);
    
    // Also check backup codes
    const isBackupCode = enrollment.backup_codes?.includes(token?.toUpperCase() || '');

    if (!isValid && !isBackupCode) {
      return json({ 
        error: 'Invalid TOTP token',
        valid: false 
      }, 401, req);
    }

    // Mark as verified if using regular token (not backup code)
    if (!enrollment.verified && isValid && !isBackupCode) {
      const { error: updateError } = await supabaseClient
        .from('totp_enrollments')
        .update({ 
          verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq('id', enrollment.id);

      if (updateError) {
        console.error('Error updating TOTP enrollment:', updateError);
      }

      // Update profile
      await supabaseClient
        .from('profiles')
        .update({
          two_factor_enabled: true,
          two_factor_method: 'totp',
          totp_secret: enrollment.secret,
          backup_codes: enrollment.backup_codes,
        })
        .eq('id', user_id);

      // Log successful verification
      await supabaseClient
        .from('audit_log')
        .insert({
          action: 'TOTP_ENROLLED',
          entity: 'authentication',
          entity_id: user_id,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          details: {
            method: 'totp',
          },
        });
    }

    return json({ 
      success: true, 
      valid: true,
      verified: !enrollment.verified,
      used_backup: isBackupCode,
    }, 200, req);
  } catch (error) {
    console.error('Error in totp-verify:', error);
    return json({ error: 'Internal server error' }, 500, req);
  }
});

