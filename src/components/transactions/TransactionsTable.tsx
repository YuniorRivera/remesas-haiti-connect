import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";

interface Transaction {
  id: string;
  codigo_referencia: string;
  emisor_nombre: string;
  beneficiario_nombre: string;
  monto_enviado_dop: number;
  monto_recibido_htg: number;
  estado: 'pendiente' | 'completada' | 'cancelada' | 'en_proceso';
  created_at: string;
  comision_agente?: number;
  margen_plataforma?: number;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  showPlatformMargin?: boolean;
}

export function TransactionsTable({ transactions, showPlatformMargin = false }: TransactionsTableProps) {
  const [search, setSearch] = useState("");
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada': return 'bg-secondary text-secondary-foreground';
      case 'pendiente': return 'bg-yellow-500 text-white';
      case 'en_proceso': return 'bg-blue-500 text-white';
      case 'cancelada': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, keyof typeof import('@/lib/i18n').translations.es> = {
      'pendiente': 'pending',
      'completada': 'completed',
      'cancelada': 'cancelled',
      'en_proceso': 'processing',
    };
    return t(statusMap[status] || 'pending');
  };

  const filteredTransactions = transactions.filter((tx) =>
    tx.codigo_referencia.toLowerCase().includes(search.toLowerCase()) ||
    tx.emisor_nombre.toLowerCase().includes(search.toLowerCase()) ||
    tx.beneficiario_nombre.toLowerCase().includes(search.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = [
      t('reference'),
      t('date'),
      'Emisor',
      t('recipient'),
      `${t('amount')} (DOP)`,
      `${t('amount')} (HTG)`,
      t('commission'),
      ...(showPlatformMargin ? ['Margen Plataforma'] : []),
      t('status')
    ];
    
    const rows = filteredTransactions.map(tx => [
      tx.codigo_referencia,
      format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm'),
      tx.emisor_nombre,
      tx.beneficiario_nombre,
      tx.monto_enviado_dop.toFixed(2),
      tx.monto_recibido_htg.toFixed(2),
      (tx.comision_agente || 0).toFixed(2),
      ...(showPlatformMargin ? [(tx.margen_plataforma || 0).toFixed(2)] : []),
      getStatusLabel(tx.estado)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacciones_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t('export')} CSV
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reference')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>Emisor</TableHead>
              <TableHead>{t('recipient')}</TableHead>
              <TableHead className="text-right">{t('amount')} (DOP)</TableHead>
              <TableHead className="text-right">{t('amount')} (HTG)</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
              {showPlatformMargin && (
                <TableHead className="text-right">Margen Plataforma</TableHead>
              )}
              <TableHead>{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showPlatformMargin ? 9 : 8} className="text-center text-muted-foreground">
                  {t('noData')}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.codigo_referencia}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{tx.emisor_nombre}</TableCell>
                  <TableCell>{tx.beneficiario_nombre}</TableCell>
                  <TableCell className="text-right font-medium">
                    {tx.monto_enviado_dop.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {tx.monto_recibido_htg.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {(tx.comision_agente || 0).toFixed(2)}
                  </TableCell>
                  {showPlatformMargin && (
                    <TableCell className="text-right text-sm font-medium text-primary">
                      {(tx.margen_plataforma || 0).toFixed(2)}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge className={getStatusColor(tx.estado)}>
                      {getStatusLabel(tx.estado)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
