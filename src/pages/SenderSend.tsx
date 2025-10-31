import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { secureSupabase } from "@/lib/secureSupabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { PricingQuote } from "@/types/api";
import { CreateRemittanceResponse, Remittance } from "@/types/api";

export default function SenderSend() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<PricingQuote | null>(null);
  
  const [formData, setFormData] = useState({
    beneficiario_nombre: "",
    beneficiario_telefono: "",
    principal_dop: "",
    channel: "MONCASH" as "MONCASH" | "SPIH",
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetQuote = async () => {
    if (!formData.beneficiario_nombre.trim()) {
      toast.error("Ingrese el nombre del beneficiario");
      return;
    }
    if (!formData.beneficiario_telefono.trim()) {
      toast.error("Ingrese el teléfono del beneficiario");
      return;
    }
    if (!formData.principal_dop || parseFloat(formData.principal_dop) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await secureSupabase.functions.invoke("pricing-quote", {
        body: {
          principal_dop: parseFloat(formData.principal_dop),
          channel: formData.channel,
        },
      });

      if (error) throw error;
      
      setQuote(data as PricingQuote);
      toast.success("Cotización generada");
    } catch (error: any) {
      console.error("Error obteniendo cotización:", error);
      toast.error(error.message || "Error al generar cotización");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToCheckout = async () => {
    if (!quote || !user) {
      toast.error("Obtén una cotización primero");
      return;
    }

    setLoading(true);
    try {
      // Crear remesa
      const { data, error } = await secureSupabase.functions.invoke("remittances-create", {
        body: {
          beneficiario_nombre: formData.beneficiario_nombre,
          beneficiario_telefono: formData.beneficiario_telefono,
          principal_dop: parseFloat(formData.principal_dop),
          channel: formData.channel,
          origin_ip: typeof window !== "undefined" ? window.location.hostname : "unknown",
        },
      });

      if (error) throw error;

      const result = data as CreateRemittanceResponse;
      if (result?.remittance) {
        toast.success("Orden creada exitosamente");
        // Redirigir a checkout con remittance y quote
        navigate("/checkout", {
          state: {
            remittance: result.remittance,
            quote: quote,
          },
        });
      } else {
        throw new Error("No se pudo crear la orden");
      }
    } catch (error: any) {
      console.error("Error creando remesa:", error);
      toast.error(error.message || "Error al crear la orden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary mt-2">Enviar Dinero</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Cotiza tu envío a Haití
            </p>
          </div>
        </header>

        <main className="container mx-auto p-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Datos del Envío
              </CardTitle>
              <CardDescription>
                Completa la información para obtener una cotización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="beneficiario_nombre">Nombre del Beneficiario *</Label>
                <Input
                  id="beneficiario_nombre"
                  value={formData.beneficiario_nombre}
                  onChange={(e) => updateField("beneficiario_nombre", e.target.value)}
                  placeholder="Marie Duval"
                />
              </div>
              
              <div>
                <Label htmlFor="beneficiario_telefono">Teléfono del Beneficiario (Haití) *</Label>
                <Input
                  id="beneficiario_telefono"
                  value={formData.beneficiario_telefono}
                  onChange={(e) => updateField("beneficiario_telefono", e.target.value)}
                  placeholder="+509 3712-3456"
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
              
              <Button
                onClick={handleGetQuote}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Cotizando..." : "Obtener Cotización"}
              </Button>
            </CardContent>
          </Card>

          {quote && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Tu Cotización</CardTitle>
                <CardDescription>
                  Detalles del envío
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
                    <span>Comisiones:</span>
                    <span className="font-medium">
                      ${quote.total_client_fees_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fee BRH:</span>
                    <span className="font-medium">
                      ${quote.gov_fee_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                    <span>Total a pagar:</span>
                    <span className="text-primary">
                      ${quote.total_charge_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-primary/10 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Tipo de cambio:</span>
                    <span className="font-medium">
                      1 DOP = {quote.client_rate_dop_to_htg?.toFixed(4)} HTG
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary">
                    <span>El beneficiario recibirá:</span>
                    <span>
                      {quote.amount_htg_to_beneficiary?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleProceedToCheckout}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? "Creando orden..." : "Proceder al Pago"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AppLayout>
  );
}