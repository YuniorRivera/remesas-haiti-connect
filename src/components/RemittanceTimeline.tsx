import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface RemittanceEvent {
  id: string;
  event: string;
  event_at: string;
  actor_type: string;
  meta?: any;
}

interface TimelineProps {
  events: RemittanceEvent[];
  payout_lat?: number;
  payout_lon?: number;
  payout_address?: string;
}

const RemittanceTimeline = ({ 
  events, 
  payout_lat, 
  payout_lon,
  payout_address 
}: TimelineProps) => {
  const getEventIcon = (event: string) => {
    switch (event) {
      case 'PAID':
      case 'SETTLED':
      case 'CONFIRMED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'CASHOUT':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      CREATED: 'Remesa Creada',
      QUOTED: 'Cotización Generada',
      CONFIRMED: 'Confirmada por Agente',
      SENT: 'Enviada a Partner',
      PAID: 'Pagada al Beneficiario',
      CASHOUT: 'Efectivo Entregado',
      SETTLED: 'Liquidada con Partner',
      FAILED: 'Falló el Pago',
      REFUNDED: 'Reembolsada',
    };
    return labels[event] || event;
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case 'PAID':
      case 'SETTLED':
      case 'CONFIRMED':
        return 'border-l-green-500';
      case 'FAILED':
        return 'border-l-red-500';
      case 'CASHOUT':
        return 'border-l-amber-500';
      case 'QUOTED':
        return 'border-l-blue-500';
      case 'SENT':
        return 'border-l-purple-500';
      default:
        return 'border-l-muted-foreground';
    }
  };

  const isValidDate = (dateString: string | undefined): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const hasLocation = payout_lat && payout_lon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline de la Remesa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos registrados</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`relative flex gap-4 pb-4 border-l-4 pl-4 ${getEventColor(event.event)}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {getEventLabel(event.event)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isValidDate(event.event_at)
                            ? format(new Date(event.event_at), 'dd/MM/yyyy HH:mm:ss')
                            : 'Fecha no disponible'}
                        </p>
                        {event.meta?.payout_receipt_num && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Recibo: {event.meta.payout_receipt_num}
                          </p>
                        )}
                        {event.meta?.payout_operator_id && (
                          <p className="text-xs text-muted-foreground">
                            Operador: {event.meta.payout_operator_id}
                          </p>
                        )}
                        {event.meta?.failure_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            Razón: {event.meta.failure_reason}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {event.actor_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mapa de ubicación de pago */}
      {hasLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación del Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payout_address && (
              <div className="text-sm">
                <span className="text-muted-foreground">Dirección:</span>
                <p className="font-medium">{payout_address}</p>
              </div>
            )}
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${payout_lon! - 0.01},${payout_lat! - 0.01},${payout_lon! + 0.01},${payout_lat! + 0.01}&layer=mapnik&marker=${payout_lat},${payout_lon}`}
                title="Ubicación del pago"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Coordenadas: {payout_lat?.toFixed(6)}, {payout_lon?.toFixed(6)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RemittanceTimeline;
