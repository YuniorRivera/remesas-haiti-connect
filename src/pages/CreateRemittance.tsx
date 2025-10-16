import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { remittanceSchema } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

export default function CreateRemittance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Emisor
    emisor_nombre: "",
    emisor_telefono: "",
    emisor_documento: "",
    
    // Beneficiario
    beneficiario_nombre: "",
    beneficiario_telefono: "",
    beneficiario_documento: "",
    payout_city: "",
    
    // Transacción
    principal_dop: "",
    channel: "MONCASH" as "MONCASH" | "SPIH",
  });

  // Datos de la cotización
  const [quote, setQuote] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [feesAvailable, setFeesAvailable] = useState(true);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const checkFeesAvailability = async () => {
    const { data, error } = await supabase
      .from('fees_matrix')
      .select('id')
      .eq('corridor', 'RD->HT')
      .eq('channel', formData.channel)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking fees:", error);
      return;
    }
    
    setFeesAvailable(!!data);
  };

  const handleGetQuote = async () => {
    if (!formData.principal_dop || parseFloat(formData.principal_dop) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    // Verificar que hay fees disponibles
    await checkFeesAvailability();
    if (!feesAvailable) {
      toast.error("No hay tarifas configuradas para este canal. Contacte al administrador.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pricing-quote", {
        body: {
          principal_dop: parseFloat(formData.principal_dop),
          channel: formData.channel,
        },
      });

      if (error) throw error;
      
      setQuote(data);
      setStep(3);
      toast.success("Cotización generada");
    } catch (error: any) {
      toast.error(error.message || "Error al generar cotización");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRemittance = async () => {
    // Validate form data
    setErrors({});
    try {
      remittanceSchema.parse({
        emisor_nombre: formData.emisor_nombre,
        emisor_telefono: formData.emisor_telefono || '',
        emisor_documento: formData.emisor_documento || '',
        beneficiario_nombre: formData.beneficiario_nombre,
        beneficiario_telefono: formData.beneficiario_telefono,
        beneficiario_documento: formData.beneficiario_documento || '',
        principal_dop: parseFloat(formData.principal_dop),
        channel: formData.channel,
        payout_city: formData.payout_city || '',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Corrige los errores en el formulario");
        return;
      }
    }

    setLoading(true);
    try {
      // Check for fraud before creating
      const { data: fraudCheck, error: fraudError } = await supabase.functions.invoke("fraud-detection", {
        body: {
          emisor_documento: formData.emisor_documento || '',
          beneficiario_telefono: formData.beneficiario_telefono,
          principal_dop: parseFloat(formData.principal_dop),
          origin_ip: window.location.hostname,
        },
      });

      if (fraudError) {
        console.warn("Fraud check failed:", fraudError);
      } else if (fraudCheck?.should_block) {
        toast.error(`Transacción bloqueada: ${fraudCheck.flags.join(', ')}`);
        return;
      } else if (fraudCheck?.risk_level === 'medium') {
        toast.warning(`Advertencia: ${fraudCheck.flags.join(', ')}`);
      }

      const { data, error } = await supabase.functions.invoke("remittances-create", {
        body: {
          emisor_nombre: formData.emisor_nombre.trim(),
          emisor_telefono: formData.emisor_telefono.trim() || null,
          emisor_documento: formData.emisor_documento.trim() || null,
          beneficiario_nombre: formData.beneficiario_nombre.trim(),
          beneficiario_telefono: formData.beneficiario_telefono.trim(),
          beneficiario_documento: formData.beneficiario_documento.trim() || null,
          principal_dop: parseFloat(formData.principal_dop),
          channel: formData.channel,
          payout_city: formData.payout_city.trim() || null,
          origin_ip: window.location.hostname,
        },
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success("Remesa creada exitosamente");
        setStep(4);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al crear remesa");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemittance = async () => {
    if (!quote?.remittance?.id) {
      toast.error("No hay cotización para confirmar");
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("remittances-confirm", {
        body: {
          remittance_id: quote.remittance.id,
        },
      });

      if (error) throw error;
      
      toast.success("Remesa confirmada y enviada");
      navigate("/transactions");
    } catch (error: any) {
      toast.error(error.message || "Error al confirmar remesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/agent-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-primary mt-2">Nueva Remesa</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-2xl">
        {/* Indicador de pasos */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 w-12 ${
                    s < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Paso 1: Datos del Emisor */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Datos del Emisor</CardTitle>
              <CardDescription>
                Información de quien envía el dinero
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emisor_nombre">Nombre Completo *</Label>
                <Input
                  id="emisor_nombre"
                  value={formData.emisor_nombre}
                  onChange={(e) => updateField("emisor_nombre", e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <Label htmlFor="emisor_telefono">Teléfono</Label>
                <Input
                  id="emisor_telefono"
                  value={formData.emisor_telefono}
                  onChange={(e) => updateField("emisor_telefono", e.target.value)}
                  placeholder="809-123-4567"
                />
              </div>
              <div>
                <Label htmlFor="emisor_documento">Documento de Identidad</Label>
                <Input
                  id="emisor_documento"
                  value={formData.emisor_documento}
                  onChange={(e) => updateField("emisor_documento", e.target.value)}
                  placeholder="001-1234567-8"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.emisor_nombre}
                className="w-full"
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paso 2: Datos del Beneficiario y Monto */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Beneficiario y Monto</CardTitle>
              <CardDescription>
                Información de quien recibe el dinero
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="beneficiario_nombre">Nombre Completo *</Label>
                <Input
                  id="beneficiario_nombre"
                  value={formData.beneficiario_nombre}
                  onChange={(e) => updateField("beneficiario_nombre", e.target.value)}
                  placeholder="Marie Duval"
                />
              </div>
              <div>
                <Label htmlFor="beneficiario_telefono">Teléfono (Haití) *</Label>
                <Input
                  id="beneficiario_telefono"
                  value={formData.beneficiario_telefono}
                  onChange={(e) => updateField("beneficiario_telefono", e.target.value)}
                  placeholder="+509 3712-3456"
                />
              </div>
              <div>
                <Label htmlFor="payout_city">Ciudad de Retiro</Label>
                <Input
                  id="payout_city"
                  value={formData.payout_city}
                  onChange={(e) => updateField("payout_city", e.target.value)}
                  placeholder="Puerto Príncipe"
                />
              </div>
              <div>
                <Label htmlFor="principal_dop">Monto a Enviar (DOP) *</Label>
                <Input
                  id="principal_dop"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.principal_dop}
                  onChange={(e) => updateField("principal_dop", e.target.value)}
                  placeholder="10000.00"
                />
              </div>
              <div>
                <Label htmlFor="channel">Canal de Pago *</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => updateField("channel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONCASH">MonCash</SelectItem>
                    <SelectItem value="SPIH">SPIH (Banco)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Atrás
                </Button>
                <Button
                  onClick={handleGetQuote}
                  disabled={
                    !formData.beneficiario_nombre ||
                    !formData.beneficiario_telefono ||
                    !formData.principal_dop ||
                    loading
                  }
                  className="flex-1"
                >
                  {loading ? "Cotizando..." : "Cotizar"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 3: Cotización */}
        {step === 3 && quote && (
          <Card>
            <CardHeader>
              <CardTitle>Cotización</CardTitle>
              <CardDescription>
                Revisa los detalles antes de confirmar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Monto a enviar:</span>
                  <span className="font-medium">
                    ${parseFloat(formData.principal_dop).toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Comisión:</span>
                  <span className="font-medium">
                    ${quote.total_client_fees_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fee Gubernamental (BRH):</span>
                  <span className="font-medium">
                    ${quote.gov_fee_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total a pagar:</span>
                  <span className="text-primary">
                    ${quote.total_client_pays_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
              </div>

              <div className="space-y-2 bg-secondary/20 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Tasa de cambio:</span>
                  <span className="font-medium">
                    1 DOP = {quote.fx_client_sell?.toFixed(4)} HTG
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-secondary">
                  <span>Beneficiario recibe:</span>
                  <span>
                    {quote.htg_to_beneficiary?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                  </span>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-green-800 dark:text-green-400">Tu comisión:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ${quote.store_commission_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Modificar
                </Button>
                <Button
                  onClick={handleCreateRemittance}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Creando..." : "Confirmar Envío"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 4: Confirmación */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-6 w-6" />
                Remesa Creada
              </CardTitle>
              <CardDescription>
                La remesa ha sido creada exitosamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Código de Referencia:</span>
                  <span className="font-mono font-bold">{quote?.remittance?.codigo_referencia}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Emisor:</span>
                  <span>{formData.emisor_nombre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Beneficiario:</span>
                  <span>{formData.beneficiario_nombre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Monto a recibir:</span>
                  <span className="font-bold text-secondary">
                    {quote?.htg_to_beneficiary?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                  </span>
                </div>
              </div>

              <Button
                onClick={handleConfirmRemittance}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Procesando..." : "Confirmar y Enviar"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/agent-dashboard")}
                className="w-full"
              >
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
