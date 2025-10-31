import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildCorsHeaders, preflight, json } from '../_shared/security.ts';
import { getTemplate, interpolateTemplate, type EventType, type Language } from '../_shared/templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Feature flags por canal
const CHANNELS = {
  email: Deno.env.get('ENABLE_EMAIL') === 'true',
  sms: Deno.env.get('ENABLE_SMS') === 'true',
  whatsapp: Deno.env.get('ENABLE_WHATSAPP') === 'true',
  push: Deno.env.get('ENABLE_PUSH') === 'true',
};

interface NotificationPayload {
  event: EventType;
  channels: string[];
  language: Language;
  to: {
    email?: string;
    phone?: string;
    push_token?: string;
  };
  variables: Record<string, string | number>;
}

interface DeliveryLog {
  channel: string;
  status: 'success' | 'failed';
  delivered_at?: string;
  error?: string;
}

/**
 * Send email notification via SMTP
 */
async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  // TODO: Implementar SMTP
  // Usar servicio como SendGrid, Mailgun, o SMTP directo
  console.log('[EMAIL] Sending:', { to, subject });
  return true;
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, message: string): Promise<boolean> {
  // TODO: Implementar Twilio
  console.log('[SMS] Sending:', { to, message });
  return true;
}

/**
 * Send WhatsApp via Business API
 */
async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  // TODO: Implementar WhatsApp Business API
  console.log('[WHATSAPP] Sending:', { to, message });
  return true;
}

/**
 * Send push notification
 */
async function sendPush(token: string, title: string, body: string): Promise<boolean> {
  // TODO: Implementar push notifications (FCM/Pusher)
  console.log('[PUSH] Sending:', { token, title, body });
  return true;
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    // Parse request
    const payload: NotificationPayload = await req.json();

    // Validate required fields
    if (!payload.event || !payload.channels || !payload.to) {
      return json({ error: 'Missing required fields: event, channels, to' }, 400, req);
    }

    // Get template and interpolate variables
    const template = getTemplate(payload.event, payload.language || 'es');
    const interpolated = interpolateTemplate(template, payload.variables);

    // Track delivery results
    const logs: DeliveryLog[] = [];
    const baseTimestamp = new Date().toISOString();

    // Send via requested channels
    for (const channel of payload.channels) {
      // Check if channel is enabled
      if (!CHANNELS[channel as keyof typeof CHANNELS]) {
        logs.push({
          channel,
          status: 'failed',
          error: 'Channel not enabled',
        });
        continue;
      }

      let success = false;
      let error: string | undefined;

      try {
        switch (channel) {
          case 'email':
            if (!payload.to.email) {
              throw new Error('Email address required');
            }
            success = await sendEmail(payload.to.email, interpolated.subject, interpolated.body);
            break;

          case 'sms':
            if (!payload.to.phone) {
              throw new Error('Phone number required');
            }
            success = await sendSMS(payload.to.phone, interpolated.sms);
            break;

          case 'whatsapp':
            if (!payload.to.phone) {
              throw new Error('Phone number required');
            }
            success = await sendWhatsApp(payload.to.phone, interpolated.whatsapp || interpolated.sms);
            break;

          case 'push':
            if (!payload.to.push_token) {
              throw new Error('Push token required');
            }
            success = await sendPush(payload.to.push_token, interpolated.subject, interpolated.sms);
            break;

          default:
            throw new Error(`Unknown channel: ${channel}`);
        }

        logs.push({
          channel,
          status: success ? 'success' : 'failed',
          delivered_at: success ? baseTimestamp : undefined,
          error: success ? undefined : 'Delivery failed',
        });
      } catch (err) {
        logs.push({
          channel,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Log to audit
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabaseClient.from('audit_log').insert({
      action: 'NOTIFICATION_SENT',
      entity: 'notification',
      details: {
        event: payload.event,
        channels: payload.channels,
        language: payload.language,
        logs,
      },
    });

    const successCount = logs.filter(l => l.status === 'success').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;

    return json({
      success: successCount > 0,
      message: `Delivered ${successCount}/${payload.channels.length} channels`,
      logs,
      summary: {
        total: payload.channels.length,
        succeeded: successCount,
        failed: failedCount,
      },
    }, 200, req);

  } catch (error) {
    console.error('Error in notify function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return json({ error: 'Error interno del servidor', details: errorMessage }, 500, req);
  }
});

