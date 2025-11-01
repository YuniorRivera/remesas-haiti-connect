import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Remittance } from "@/types/api";

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [remittance, setRemittance] = useState<Remittance | null>(null);
  const [status, setStatus] = useState<'processing' | 'paid' | 'failed' | 'pending'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkPayment = async () => {
      try {
        // Get remittance_id from sessionStorage or URL params
        const pendingPayment = sessionStorage.getItem('pending_payment');
        const remittanceId = searchParams.get('remittance_id') || 
          (pendingPayment ? JSON.parse(pendingPayment).remittance_id : null);

        if (!remittanceId) {
          setStatus('failed');
          setMessage('No se pudo identificar la remesa');
          setLoading(false);
          return;
        }

        // Fetch remittance
        const { data, error } = await supabase
          .from('remittances')
          .select('*')
          .eq('id', remittanceId)
          .single();

        if (error) throw error;

        setRemittance(data);

        // Check status from webhook
        if (data.state === 'PAID') {
          setStatus('paid');
          setMessage('¡Pago confirmado! Tu remesa fue enviada exitosamente.');
        } else if (data.state === 'FAILED') {
          setStatus('failed');
          setMessage('El pago no pudo ser procesado. Por favor, intenta nuevamente.');
        } else if (data.state === 'CONFIRMED') {
          setStatus('pending');
          setMessage('Tu remesa está siendo procesada. Recibirás una notificación cuando se complete.');
        } else {
          setStatus('processing');
          setMessage('Verificando estado del pago...');
          
          // Poll for status update (webhook should update it)
          const pollInterval = setInterval(async () => {
            const { data: updated, error } = await supabase
              .from('remittances')
              .select('state')
              .eq('id', remittanceId)
              .single();

            if (!error && updated) {
              if (updated.state === 'PAID') {
                setStatus('paid');
                setMessage('¡Pago confirmado! Tu remesa fue enviada exitosamente.');
                clearInterval(pollInterval);
                setLoading(false);
              } else if (updated.state === 'FAILED') {
                setStatus('failed');
                setMessage('El pago no pudo ser procesado.');
                clearInterval(pollInterval);
                setLoading(false);
              }
            }
          }, 3000);

          // Cleanup after 60 seconds
          setTimeout(() => {
            clearInterval(pollInterval);
            if (status === 'processing') {
              setStatus('pending');
              setMessage('La verificación está tomando más tiempo de lo esperado.');
              setLoading(false);
            }
          }, 60000);
        }

        // Clear session storage
        sessionStorage.removeItem('pending_payment');
      } catch (error) {
        console.error('Error checking payment:', error);
        setStatus('failed');
        setMessage('Error al verificar el estado del pago.');
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, [searchParams]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Estado del Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Icon */}
              <div className="flex justify-center">
                {loading || status === 'processing' ? (
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                ) : status === 'paid' ? (
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-600" />
                )}
              </div>

              {/* Message */}
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">
                  {status === 'processing' && 'Verificando pago...'}
                  {status === 'paid' && '¡Pago Confirmado!'}
                  {status === 'failed' && 'Pago No Procesado'}
                  {status === 'pending' && 'Pendiente de Confirmación'}
                </p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>

              {/* Remittance Details */}
              {remittance && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Referencia:</span>
                    <span className="font-mono font-semibold">{remittance.codigo_referencia}</span>
                  </div>
                  {remittance.beneficiario_nombre && (
                    <div className="flex justify-between text-sm">
                      <span>Beneficiario:</span>
                      <span className="font-medium">{remittance.beneficiario_nombre}</span>
                    </div>
                  )}
                  {remittance.htg_to_beneficiary && (
                    <div className="flex justify-between text-sm">
                      <span>Monto a Recibir:</span>
                      <span className="font-bold text-green-600">
                        {remittance.htg_to_beneficiary.toFixed(2)} HTG
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {status === 'paid' && (
                  <>
                    <Button onClick={() => navigate('/transactions')} className="w-full">
                      Ver Mis Transacciones
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/send')}
                      className="w-full"
                    >
                      Enviar Otra Remesa
                    </Button>
                  </>
                )}
                {status === 'failed' && (
                  <>
                    <Button onClick={() => navigate('/send')} className="w-full">
                      Intentar Nuevamente
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/dashboard')}
                      className="w-full"
                    >
                      Volver al Dashboard
                    </Button>
                  </>
                )}
                {status === 'pending' && (
                  <Button onClick={() => navigate('/transactions')} className="w-full">
                    Ver Mis Transacciones
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

