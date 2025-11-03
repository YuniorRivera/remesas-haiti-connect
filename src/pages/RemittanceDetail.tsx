import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import RemittanceTimeline from "@/components/RemittanceTimeline";
import { logger } from "@/lib/logger";

interface RemittanceEvent {
  id: string;
  event: string;
  event_at: string;
  actor_type: string;
  meta?: Record<string, unknown> | null;
}

interface Remittance {
  id: string;
  codigo_referencia: string;
  state?: string | null;
  emisor_nombre: string;
  emisor_telefono?: string;
  emisor_documento?: string;
  beneficiario_nombre: string;
  beneficiario_telefono?: string;
  beneficiario_documento?: string;
  principal_dop: number;
  total_client_pays_dop?: number;
  total_client_fees_dop?: number;
  gov_fee_dop?: number;
  htg_to_beneficiary?: number;
  fx_client_sell?: number;
  channel?: string;
  payout_agent_name?: string;
  payout_address?: string;
  payout_lat?: number;
  payout_lon?: number;
  payout_receipt_num?: string;
  created_at: string;
  quoted_at?: string;
  confirmed_at?: string;
  sent_at?: string;
  paid_at?: string;
  settled_at?: string;
  failed_at?: string;
  platform_gross_margin_dop?: number;
  comision_agente?: number;
}

const RemittanceDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isComplianceOfficer } = useUserRole(user?.id);
  const { t } = useLocale();
  const [remittance, setRemittance] = useState<Remittance | null>(null);
  const [events, setEvents] = useState<RemittanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const showPlatformData = isAdmin || isComplianceOfficer;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchRemittanceDetails();
    }
  }, [user, id]);

  const fetchRemittanceDetails = async () => {
    try {
      const { data: remittanceData, error: remittanceError } = await supabase
        .from("remittances")
        .select("*")
        .eq("id", id!)
        .maybeSingle();

      if (remittanceError) throw remittanceError;
      setRemittance(remittanceData as any);

      const { data: eventsData, error: eventsError } = await supabase
        .from("remittance_events")
        .select("*")
        .eq("remittance_id", id!)
        .order("event_at", { ascending: true });

      if (eventsError) throw eventsError;
      setEvents((eventsData || []) as any);
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
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

  const handlePrintReceipt = async () => {
    if (!remittance) return;

    try {
      // Crear PDF en formato térmico (80mm)
      const doc = new jsPDF({
        format: [80, 200],
        unit: 'mm'
      });

      // Generar código QR con el código de referencia
      const qrDataUrl = await QRCode.toDataURL(remittance.codigo_referencia, {
        width: 120,
        margin: 1,
      });

      // Configurar fuente
      doc.setFont("helvetica");
      
      let yPos = 10;
      
      // Título
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RECIBO DE REMESA", 40, yPos, { align: 'center' });
      yPos += 7;

      // Agregar QR Code
      doc.addImage(qrDataUrl, 'PNG', 25, yPos, 30, 30);
      yPos += 32;

      // Código de referencia
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Ref: ${remittance.codigo_referencia}`, 40, yPos, { align: 'center' });
      yPos += 5;
      
      doc.text(`Fecha: ${format(new Date(remittance.created_at), 'dd/MM/yyyy HH:mm')}`, 40, yPos, { align: 'center' });
      yPos += 8;

      // Línea separadora
      doc.setLineWidth(0.3);
      doc.line(10, yPos, 70, yPos);
      yPos += 5;

      // EMISOR
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("EMISOR", 10, yPos);
      yPos += 5;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${remittance.emisor_nombre}`, 10, yPos);
      yPos += 4;
      
      if (remittance.emisor_telefono) {
        doc.text(`Telefono: ${remittance.emisor_telefono}`, 10, yPos);
        yPos += 4;
      }
      
      if (remittance.emisor_documento) {
        doc.text(`Documento: ${remittance.emisor_documento}`, 10, yPos);
        yPos += 4;
      }
      yPos += 3;

      // BENEFICIARIO
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("BENEFICIARIO", 10, yPos);
      yPos += 5;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${remittance.beneficiario_nombre}`, 10, yPos);
      yPos += 4;
      
      if (remittance.beneficiario_telefono) {
        doc.text(`Telefono: ${remittance.beneficiario_telefono}`, 10, yPos);
        yPos += 4;
      }
      yPos += 3;

      // Línea separadora
      doc.line(10, yPos, 70, yPos);
      yPos += 5;

      // TRANSACCIÓN
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("TRANSACCION", 10, yPos);
      yPos += 5;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Monto enviado:`, 10, yPos);
      doc.text(`${remittance.principal_dop.toFixed(2)} DOP`, 70, yPos, { align: 'right' });
      yPos += 4;
      
      if (remittance.total_client_fees_dop) {
        doc.text(`Comision:`, 10, yPos);
        doc.text(`${remittance.total_client_fees_dop.toFixed(2)} DOP`, 70, yPos, { align: 'right' });
        yPos += 4;
      }
      
      if (remittance.gov_fee_dop) {
        doc.text(`Fee BRH:`, 10, yPos);
        doc.text(`${remittance.gov_fee_dop.toFixed(2)} DOP`, 70, yPos, { align: 'right' });
        yPos += 4;
      }
      
      // Línea subtotal
      doc.setLineWidth(0.1);
      doc.line(10, yPos, 70, yPos);
      yPos += 4;
      
      if (remittance.total_client_pays_dop) {
        doc.setFont("helvetica", "bold");
        doc.text(`Total pagado:`, 10, yPos);
        doc.text(`${remittance.total_client_pays_dop.toFixed(2)} DOP`, 70, yPos, { align: 'right' });
        yPos += 6;
      }
      
      // Línea separadora
      doc.setLineWidth(0.3);
      doc.line(10, yPos, 70, yPos);
      yPos += 5;
      
      doc.setFont("helvetica", "normal");
      if (remittance.htg_to_beneficiary) {
        doc.text(`Beneficiario recibe:`, 10, yPos);
        doc.setFont("helvetica", "bold");
        doc.text(`${remittance.htg_to_beneficiary.toFixed(2)} HTG`, 70, yPos, { align: 'right' });
        yPos += 4;
      }
      
      doc.setFont("helvetica", "normal");
      if (remittance.fx_client_sell) {
        doc.text(`Tasa cambio: 1 DOP = ${remittance.fx_client_sell.toFixed(4)} HTG`, 10, yPos);
        yPos += 6;
      }
      
      // Línea separadora
      doc.line(10, yPos, 70, yPos);
      yPos += 5;
      
      // Información adicional
      if (remittance.channel) {
        doc.text(`Canal: ${remittance.channel}`, 10, yPos);
        yPos += 4;
      }
      
      doc.text(`Estado: ${remittance.state}`, 10, yPos);
      yPos += 6;

      // Pie de página
      doc.setFontSize(7);
      doc.text("Gracias por su preferencia", 40, yPos, { align: 'center' });
      yPos += 3;
      doc.text("================================", 40, yPos, { align: 'center' });

      // Guardar PDF
      doc.save(`recibo_${remittance.codigo_referencia}.pdf`);
      toast.success("Recibo generado exitosamente");
    } catch (error) {
      const err = error as { message?: string };
      logger.error("Error generando PDF:", err);
      toast.error("Error al generar el recibo");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (!remittance) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/transactions")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('myTransactions')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {t('reference')}: {remittance.codigo_referencia}
              </h1>
              <Badge className={`mt-2 ${getStateColor(remittance.state || 'CREATED')}`}>
                {remittance.state || 'CREATED'}
              </Badge>
            </div>
            <Button onClick={handlePrintReceipt} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Reimprimir Recibo
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        {/* Timeline con Mapa */}
        <RemittanceTimeline 
          events={events}
          payout_lat={remittance.payout_lat}
          payout_lon={remittance.payout_lon}
          payout_address={remittance.payout_address}
        />

        {/* Transaction Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Emisor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Nombre:</span>
                <p className="font-medium">{remittance.emisor_nombre}</p>
              </div>
              {remittance.emisor_telefono && (
                <div>
                  <span className="text-sm text-muted-foreground">Teléfono:</span>
                  <p className="font-medium">{remittance.emisor_telefono}</p>
                </div>
              )}
              {remittance.emisor_documento && (
                <div>
                  <span className="text-sm text-muted-foreground">Documento:</span>
                  <p className="font-medium">{remittance.emisor_documento}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos del Beneficiario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Nombre:</span>
                <p className="font-medium">{remittance.beneficiario_nombre}</p>
              </div>
              {remittance.beneficiario_telefono && (
                <div>
                  <span className="text-sm text-muted-foreground">Teléfono:</span>
                  <p className="font-medium">{remittance.beneficiario_telefono}</p>
                </div>
              )}
              {remittance.beneficiario_documento && (
                <div>
                  <span className="text-sm text-muted-foreground">Documento:</span>
                  <p className="font-medium">{remittance.beneficiario_documento}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles Financieros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <span className="text-sm text-muted-foreground">Monto Enviado (DOP):</span>
                <p className="text-2xl font-bold">{remittance.principal_dop.toFixed(2)}</p>
              </div>
              {remittance.total_client_pays_dop && (
                <div>
                  <span className="text-sm text-muted-foreground">Total Cliente Paga (DOP):</span>
                  <p className="text-2xl font-bold">{remittance.total_client_pays_dop.toFixed(2)}</p>
                </div>
              )}
              {remittance.htg_to_beneficiary && (
                <div>
                  <span className="text-sm text-muted-foreground">Recibe (HTG):</span>
                  <p className="text-2xl font-bold text-primary">{remittance.htg_to_beneficiary.toFixed(2)}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              {remittance.fx_client_sell && (
                <div>
                  <span className="text-sm text-muted-foreground">Tasa de Cambio:</span>
                  <p className="font-medium">{remittance.fx_client_sell.toFixed(4)}</p>
                </div>
              )}
              {remittance.total_client_fees_dop && (
                <div>
                  <span className="text-sm text-muted-foreground">Comisiones Cliente (DOP):</span>
                  <p className="font-medium">{remittance.total_client_fees_dop.toFixed(2)}</p>
                </div>
              )}
              {remittance.gov_fee_dop && (
                <div>
                  <span className="text-sm text-muted-foreground">Tarifa Gubernamental BRH (DOP):</span>
                  <p className="font-medium">{remittance.gov_fee_dop.toFixed(2)}</p>
                </div>
              )}
              {remittance.comision_agente && (
                <div>
                  <span className="text-sm text-muted-foreground">Comisión Tienda (DOP):</span>
                  <p className="font-medium text-green-600">{remittance.comision_agente.toFixed(2)}</p>
                </div>
              )}
              {showPlatformData && remittance.platform_gross_margin_dop && (
                <div>
                  <span className="text-sm text-muted-foreground">Margen Plataforma (DOP):</span>
                  <p className="font-medium text-primary">{remittance.platform_gross_margin_dop.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payout Information */}
        {(remittance.payout_agent_name || remittance.payout_address || (remittance.payout_lat && remittance.payout_lon)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {remittance.payout_agent_name && (
                <div>
                  <span className="text-sm text-muted-foreground">Agente Pagador:</span>
                  <p className="font-medium">{remittance.payout_agent_name}</p>
                </div>
              )}
              {remittance.payout_address && (
                <div>
                  <span className="text-sm text-muted-foreground">Dirección de Pago:</span>
                  <p className="font-medium">{remittance.payout_address}</p>
                </div>
              )}
              {remittance.payout_receipt_num && (
                <div>
                  <span className="text-sm text-muted-foreground">Número de Recibo:</span>
                  <p className="font-medium">{remittance.payout_receipt_num}</p>
                </div>
              )}
              {remittance.payout_lat && remittance.payout_lon && (
                <div>
                  <span className="text-sm text-muted-foreground">Ubicación GPS:</span>
                  <p className="font-medium">{remittance.payout_lat.toFixed(6)}, {remittance.payout_lon.toFixed(6)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Mapa interactivo próximamente)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Events Log (Admin only) */}
        {showPlatformData && events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Registro de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{event.event}</span>
                      <p className="text-xs text-muted-foreground">{event.actor_type}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.event_at), 'dd/MM/yyyy HH:mm:ss')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default RemittanceDetail;
