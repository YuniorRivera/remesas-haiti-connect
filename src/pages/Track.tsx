import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Share2, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import RemittanceTimeline from "@/components/RemittanceTimeline";

interface RemittanceEvent {
  id: string;
  event: string;
  event_at: string;
  actor_type: string;
  meta?: Record<string, unknown>;
}

interface Remittance {
  id: string;
  codigo_referencia: string;
  state: string;
  emisor_nombre: string;
  beneficiario_nombre: string;
  principal_dop: number;
  htg_to_beneficiary?: number;
  payout_lat?: number;
  payout_lon?: number;
  payout_address?: string;
  created_at: string;
  quoted_at?: string;
  confirmed_at?: string;
  sent_at?: string;
  paid_at?: string;
  settled_at?: string;
}

export default function Track() {
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [remittance, setRemittance] = useState<Remittance | null>(null);
  const [events, setEvents] = useState<RemittanceEvent[]>([]);

  const handleSearchAuto = useCallback(async (code: string) => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const { data: remittanceData, error: remittanceError } = await supabase
        .from("remittances")
        .select("*")
        .eq("codigo_referencia", code.trim())
        .maybeSingle();

      if (remittanceError) throw remittanceError;

      if (!remittanceData) {
        setRemittance(null);
        setEvents([]);
        return;
      }

      setRemittance(remittanceData);

      const { data: eventsData, error: eventsError } = await supabase
        .from("remittance_events")
        .select("*")
        .eq("remittance_id", remittanceData.id)
        .order("event_at", { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (_error) {
      setRemittance(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for code in URL params and auto-search
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && codeFromUrl !== trackingCode) {
      setTrackingCode(codeFromUrl.toUpperCase());
      handleSearchAuto(codeFromUrl.toUpperCase());
    }
  }, [searchParams, trackingCode, handleSearchAuto]);

  const handleSearch = async () => {
    if (!trackingCode.trim()) {
      toast.error("Ingresa un código de seguimiento");
      return;
    }

    setLoading(true);
    try {
      // Buscar remesa por código de referencia
      const { data: remittanceData, error: remittanceError } = await supabase
        .from("remittances")
        .select("*")
        .eq("codigo_referencia", trackingCode.trim())
        .maybeSingle();

      if (remittanceError) throw remittanceError;

      if (!remittanceData) {
        toast.error("No se encontró ninguna remesa con ese código");
        setRemittance(null);
        setEvents([]);
        return;
      }

      setRemittance(remittanceData);

      // Cargar eventos
      const { data: eventsData, error: eventsError } = await supabase
        .from("remittance_events")
        .select("*")
        .eq("remittance_id", remittanceData.id)
        .order("event_at", { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      toast.success("Remesa encontrada");
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Error al buscar la remesa");
      setRemittance(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!remittance) return;
    
    const trackingUrl = `${window.location.origin}/track?code=${remittance.codigo_referencia}`;
    navigator.clipboard.writeText(trackingUrl);
    toast.success("Link copiado al portapapeles");
  };

  const handleShareWhatsApp = () => {
    if (!remittance) return;
    
    const trackingUrl = `${window.location.origin}/track?code=${remittance.codigo_referencia}`;
    const message = `Rastrea tu remesa: ${remittance.codigo_referencia}\n${trackingUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareSMS = () => {
    if (!remittance) return;
    
    const trackingUrl = `${window.location.origin}/track?code=${remittance.codigo_referencia}`;
    const message = `Rastrea tu remesa: ${remittance.codigo_referencia}\n${trackingUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const getStateColor = (state: string) => {
    const stateMap: Record<string, string> = {
      CREATED: 'bg-gray-500 text-white',
      QUOTED: 'bg-blue-500 text-white',
      CONFIRMED: 'bg-indigo-500 text-white',
      SENT: 'bg-purple-500 text-white',
      PAID: 'bg-green-500 text-white',
      SETTLED: 'bg-secondary text-secondary-foreground',
      FAILED: 'bg-destructive text-destructive-foreground',
      REFUNDED: 'bg-orange-500 text-white',
    };
    return stateMap[state] || 'bg-muted';
  };

  const getStateLabel = (state: string) => {
    const labels: Record<string, string> = {
      CREATED: 'Creada',
      QUOTED: 'Cotizada',
      CONFIRMED: 'Confirmada',
      SENT: 'Enviada',
      PAID: 'Pagada',
      SETTLED: 'Liquidada',
      FAILED: 'Fallida',
      REFUNDED: 'Reembolsada',
    };
    return labels[state] || state;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Rastrear Remesa</h1>
          <p className="text-muted-foreground mt-1">
            Ingresa tu código de seguimiento para ver el estado de tu remesa
          </p>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-4xl">
        {/* Search Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Código de Seguimiento
            </CardTitle>
            <CardDescription>
              Ingresa el código de referencia de tu remesa (ej: REM-XXXXXX-XXXX)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="REM-XXXXXX-XXXX"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="text-lg font-mono"
                disabled={loading}
              />
              <Button onClick={handleSearch} disabled={loading || !trackingCode.trim()}>
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {remittance && (
          <div className="space-y-6">
            {/* Remittance Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl font-mono">{remittance.codigo_referencia}</span>
                      <Badge className={getStateColor(remittance.state)}>
                        {getStateLabel(remittance.state)}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {remittance.emisor_nombre} → {remittance.beneficiario_nombre}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareSMS}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      SMS
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monto Enviado</p>
                  <p className="text-2xl font-bold">
                    ${remittance.principal_dop.toFixed(2)} DOP
                  </p>
                </div>
                {remittance.htg_to_beneficiary && (
                  <div>
                    <p className="text-sm text-muted-foreground">Recibirá</p>
                    <p className="text-2xl font-bold text-green-600">
                      {remittance.htg_to_beneficiary.toFixed(2)} HTG
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <RemittanceTimeline
              events={events}
              currentState={remittance.state}
              payout_lat={remittance.payout_lat}
              payout_lon={remittance.payout_lon}
              payout_address={remittance.payout_address}
            />
          </div>
        )}

        {/* Empty State */}
        {!remittance && trackingCode && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No se encontró ninguna remesa</p>
              <p className="text-muted-foreground">
                Verifica que el código de seguimiento sea correcto
              </p>
            </CardContent>
          </Card>
        )}

        {/* Initial State */}
        {!remittance && !trackingCode && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Ingresa tu código de seguimiento</p>
              <p className="text-muted-foreground">
                El código está en el recibo o confirmación de tu remesa
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

