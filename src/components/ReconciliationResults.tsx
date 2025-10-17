import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReconciliationResultsProps {
  reconciliation: any;
  onResolve: () => void;
}

export function ReconciliationResults({ reconciliation, onResolve }: ReconciliationResultsProps) {
  const data = reconciliation.data_json || { matched: [], unmatched: [], summary: {} };
  const { matched = [], unmatched = [], summary = {} } = data;

  const handleResolve = async () => {
    const { error } = await supabase
      .from('reconciliations')
      .update({ status: 'reconciled' })
      .eq('id', reconciliation.id);

    if (error) {
      toast.error("Error al marcar como resuelta");
      return;
    }

    toast.success("Reconciliación marcada como resuelta");
    onResolve();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reconciled':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Reconciliada</Badge>;
      case 'pending':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Reconciliación #{reconciliation.id.slice(0, 8)}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Fuente: {reconciliation.source} • Procesada: {new Date(reconciliation.processed_at).toLocaleString('es-DO')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(reconciliation.status)}
            {reconciliation.status === 'pending' && (
              <Button onClick={handleResolve} size="sm">
                Marcar como Resuelta
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{summary.total_items || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Coincidencias</p>
              <p className="text-2xl font-bold text-green-600">{summary.matched_count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sin Coincidir</p>
              <p className="text-2xl font-bold text-orange-600">{summary.unmatched_count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variación Total</p>
              <p className={`text-2xl font-bold ${Math.abs(summary.total_variance || 0) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(summary.total_variance || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {matched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Transacciones Coincidentes ({matched.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Externo</TableHead>
                  <TableHead className="text-right">Interno</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matched.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{item.external_ref}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString('es-DO')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.external_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.internal_amount)}</TableCell>
                    <TableCell className={`text-right font-semibold ${Math.abs(item.variance) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(item.variance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {unmatched.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              Transacciones Sin Coincidir ({unmatched.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatched.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm">{item.reference}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString('es-DO')}</TableCell>
                    <TableCell>
                      <Badge variant={item.type === 'external' ? 'default' : 'secondary'}>
                        {item.type === 'external' ? 'Externo' : 'Interno'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
