import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, CreditCard } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PricingQuote } from "@/types/api";
import { Remittance } from "@/types/api";

interface CheckoutState {
  remittance: Remittance;
  quote: PricingQuote;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [redirecting, setRedirecting] = useState(false);

  // Get remittance and quote from location state
  const { remittance, quote } = (location.state || {}) as CheckoutState;

  if (!remittance || !quote) {
    navigate("/send");
    return null;
  }

  const handlePayNow = async () => {
    setRedirecting(true);
    
    // MOCK: Simular redirección al banco RD
    // En producción, esto redirigiría a la URL real del banco
    const bankCheckoutUrl = import.meta.env.VITE_BANK_CHECKOUT_URL || 
      `https://mock-bank-rd.local/checkout?orderId=${remittance.id}&amount=${remittance.principal_dop}`;
    
    // Guardar la sesión para cuando regrese
    sessionStorage.setItem('pending_payment', JSON.stringify({
      remittance_id: remittance.id,
      return_url: window.location.origin + '/payment-callback',
    }));

    // Redirigir al banco
    window.location.href = bankCheckoutUrl;
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/send")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-primary mt-2">Confirmación de Pago</h1>
          </div>
        </header>

        <main className="container mx-auto p-6 max-w-2xl">
          {/* Paso 1: Desglose Completo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Resumen de tu Remesa
              </CardTitle>
              <CardDescription>
                Revisa los detalles antes de proceder al pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Monto enviado */}
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Monto a Enviar
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  ${quote.principal_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                </p>
              </div>

              {/* Desglose de tarifas */}
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Desglose de Costos:</p>
                <div className="flex justify-between text-sm">
                  <span>Comisión Kobcash:</span>
                  <span className="font-medium">
                    ${quote.total_client_fees_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tarifa BRH (Haití):</span>
                  <span className="font-medium">
                    ${quote.gov_fee_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base">
                  <span>Total a Pagar:</span>
                  <span className="text-primary">
                    ${quote.total_client_pays_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
              </div>

              {/* Tipo de cambio y neto a recibir */}
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border-2 border-green-300 dark:border-green-700">
                <p className="text-sm text-muted-foreground mb-2">
                  Tipo de Cambio: <span className="font-medium">1 DOP = {quote.fx_client_sell?.toFixed(4)} HTG</span>
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-800 dark:text-green-400">
                    El beneficiario recibirá:
                  </span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-500">
                    {quote.htg_to_beneficiary?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                  </span>
                </div>
              </div>

              {/* Información del beneficiario */}
              <div className="border-t pt-4 space-y-2">
                <p className="font-semibold text-sm">Beneficiario:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium">Nombre:</span> {remittance.beneficiario_nombre}</p>
                  <p><span className="font-medium">Teléfono:</span> {remittance.beneficiario_telefono}</p>
                  <p><span className="font-medium">Canal:</span> {remittance.channel}</p>
                </div>
              </div>

              {/* Código de referencia */}
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-mono font-semibold text-amber-900 dark:text-amber-100">
                  Código de Referencia: {remittance.codigo_referencia || 'Cargando...'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Paso 2: Botón de Pago */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-blue-700 dark:text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">
                        Pago Seguro mediante Banco
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Serás redirigido a la plataforma segura del banco para completar el pago.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePayNow}
                  disabled={loading || redirecting}
                  size="lg"
                  className="w-full"
                >
                  {redirecting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Redirigiendo al banco...
                    </>
                  ) : (
                    <>
                      Proceder al Pago <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Al hacer clic, serás redirigido a un sitio seguro del banco para procesar el pago.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppLayout>
  );
}

