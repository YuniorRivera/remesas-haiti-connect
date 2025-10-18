import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Percent, TrendingUp, Download, FileSpreadsheet, FileText } from "lucide-react";

export default function AdminMargins() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [margins, setMargins] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgMargin: 0,
    todayEarnings: 0,
    monthEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchMargins();
    }
  }, [user, isAdmin]);

  const fetchMargins = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Obtener datos de remesas
      const { data: remittances } = await supabase
        .from('remittances')
        .select('principal_dop, platform_gross_margin_dop, created_at, channel')
        .not('state', 'eq', 'FAILED')
        .order('created_at', { ascending: false })
        .limit(100);

      if (remittances && remittances.length > 0) {
        // Calcular margen promedio
        const totalGmv = remittances.reduce((sum, r) => sum + (r.principal_dop || 0), 0);
        const totalMargin = remittances.reduce((sum, r) => sum + (r.platform_gross_margin_dop || 0), 0);
        const avgMargin = totalGmv > 0 ? (totalMargin / totalGmv) * 100 : 0;

        // Ganancias de hoy
        const todayRemittances = remittances.filter(r => new Date(r.created_at) >= today);
        const todayEarnings = todayRemittances.reduce((sum, r) => sum + (r.platform_gross_margin_dop || 0), 0);

        // Ganancias del mes
        const monthRemittances = remittances.filter(r => new Date(r.created_at) >= monthAgo);
        const monthEarnings = monthRemittances.reduce((sum, r) => sum + (r.platform_gross_margin_dop || 0), 0);

        // Agrupar por canal
        const marginsByChannel = remittances.reduce((acc: any, r) => {
          const channel = r.channel || 'UNKNOWN';
          if (!acc[channel]) {
            acc[channel] = {
              channel,
              gmv: 0,
              margin: 0,
              count: 0,
            };
          }
          acc[channel].gmv += r.principal_dop || 0;
          acc[channel].margin += r.platform_gross_margin_dop || 0;
          acc[channel].count += 1;
          return acc;
        }, {});

        setStats({
          avgMargin,
          todayEarnings,
          monthEarnings,
        });

        setMargins(Object.values(marginsByChannel));
      }
    } catch (error) {
      console.error('Error fetching margins:', error);
      toast.error('Error al cargar márgenes');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Canal', 'GMV (DOP)', 'Margen (DOP)', 'Tasa (%)', 'Transacciones'];
    const rows = margins.map(m => [
      m.channel,
      m.gmv.toFixed(2),
      m.margin.toFixed(2),
      ((m.margin / m.gmv) * 100).toFixed(2),
      m.count,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `margenes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV exportado exitosamente');
  };

  if (authLoading || roleLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Márgenes de Plataforma</h1>
              <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Acceso restringido a administradores</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Margen Promedio</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.avgMargin.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Take rate general</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ganancias Hoy</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                ${stats.todayEarnings.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Margen generado</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ganancias Este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                ${stats.monthEarnings.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Últimos 30 días</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Márgenes por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">GMV (DOP)</TableHead>
                  <TableHead className="text-right">Margen (DOP)</TableHead>
                  <TableHead className="text-right">Tasa (%)</TableHead>
                  <TableHead className="text-right">Transacciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {margins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay datos de márgenes disponibles
                    </TableCell>
                  </TableRow>
                ) : (
                  margins.map((m) => (
                    <TableRow key={m.channel}>
                      <TableCell className="font-medium">{m.channel}</TableCell>
                      <TableCell className="text-right">
                        ${m.gmv.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-primary font-semibold">
                        ${m.margin.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-primary">
                          {((m.margin / m.gmv) * 100).toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{m.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
