import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  RefreshCw,
  CheckCircle,
  Download,
  ArrowLeft,
  Activity,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface KPIData {
  date: string;
  volume: number;
  success: number;
  failed: number;
  avgTime: number;
  p95Time: number;
}

interface ChannelData {
  name: string;
  volume: number;
  count: number;
}

interface ErrorCount {
  error: string;
  count: number;
}

interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6'];

export default function AdminKPIs() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  
  const [kpis, setKpis] = useState({
    totalVolume: 0,
    successRate: 0,
    avgDeliveryTime: 0,
    p95DeliveryTime: 0,
    retryRate: 0,
    totalTransactions: 0,
    totalFailed: 0,
  });

  const [chartData, setChartData] = useState<KPIData[]>([]);
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [topErrors, setTopErrors] = useState<ErrorCount[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
      toast.error("Acceso denegado. Solo administradores.");
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  const fetchKPIData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
      }

      let query = supabase
        .from("remittances")
        .select("id, principal_dop, state, channel, created_at, confirmed_at, settled_at, failed_at")
        .gte("created_at", startDate.toISOString());

      if (channelFilter !== 'all' && (channelFilter === 'MONCASH' || channelFilter === 'SPIH')) {
        query = query.eq('channel', channelFilter);
      }

      const { data: remittances, error } = await query;

      if (error) throw error;

      // Calculate KPIs
      const total = remittances?.length || 0;
      const successful = remittances?.filter(r => r.state === 'CONFIRMED' || r.state === 'SENT').length || 0;
      const failed = remittances?.filter(r => r.state === 'FAILED').length || 0;
      
      // Calculate times
      const times = remittances
        ?.filter(r => r.confirmed_at && r.settled_at)
        .map(r => {
          if (!r.confirmed_at || !r.settled_at) return null;
          const start = new Date(r.confirmed_at).getTime();
          const end = new Date(r.settled_at).getTime();
          return (end - start) / 1000 / 60; // minutes
        })
        .filter((t): t is number => t !== null) || [];

      const avgTime = times.length > 0 
        ? times.reduce((sum, t) => sum + t, 0) / times.length 
        : 0;

      // P95 time
      const sortedTimes = [...times].sort((a, b) => a - b);
      const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
      const p95Time = sortedTimes[p95Index] || 0;

      setKpis({
        totalVolume: remittances?.reduce((sum, r) => sum + (r.principal_dop || 0), 0) || 0,
        successRate: total > 0 ? (successful / total) * 100 : 0,
        avgDeliveryTime: avgTime,
        p95DeliveryTime: p95Time,
        retryRate: 0, // Would need retry tracking
        totalTransactions: total,
        totalFailed: failed,
      });

      // Generate daily chart data
      const dailyData: Record<string, KPIData> = {};
      remittances?.forEach(r => {
        const date = r.created_at?.split('T')[0];
        if (!date) return;
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            volume: 0,
            success: 0,
            failed: 0,
            avgTime: 0,
            p95Time: 0,
          };
        }
        dailyData[date].volume += r.principal_dop || 0;
        if (r.state === 'CONFIRMED' || r.state === 'SENT') {
          dailyData[date].success += 1;
        } else if (r.state === 'FAILED') {
          dailyData[date].failed += 1;
        }
      });

      setChartData(Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)));

      // Channel breakdown
      const channelBreakdown: Record<string, { volume: number; count: number }> = {};
      remittances?.forEach(r => {
        const ch = r.channel || 'OTHER';
        if (!channelBreakdown[ch]) {
          channelBreakdown[ch] = { volume: 0, count: 0 };
        }
        channelBreakdown[ch].volume += r.principal_dop || 0;
        channelBreakdown[ch].count += 1;
      });

      setChannelData(Object.entries(channelBreakdown).map(([name, data]) => ({ name, ...data })));

      // Top errors (mock data for now)
      setTopErrors([
        { error: 'Timeout en pago', count: 15 },
        { error: 'Fondos insuficientes', count: 8 },
        { error: 'Datos inválidos', count: 5 },
        { error: 'Error de red', count: 3 },
      ]);

      // Alerts
      setAlerts([
        { id: '1', severity: 'high', message: 'Tasa de fallos aumentó 15% en últimos 2 días', timestamp: new Date().toISOString() },
        { id: '2', severity: 'medium', message: 'P95 tiempo entrega: 12.5 min (objetivo: <10 min)', timestamp: new Date().toISOString() },
        { id: '3', severity: 'low', message: 'Nuevo agente registrado', timestamp: new Date().toISOString() },
      ]);

    } catch (error: unknown) {
      console.error('Error fetching KPI data:', error);
      toast.error("Error al cargar métricas operativas");
    } finally {
      setLoading(false);
    }
  }, [dateRange, channelFilter]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchKPIData();
    }
  }, [user, isAdmin, fetchKPIData]);

  const handleExportCSV = () => {
    // Generate CSV from chart data
    const headers = ['Fecha', 'Volumen (DOP)', 'Exitosas', 'Fallidas', 'Tiempo Promedio (min)', 'P95 (min)'];
    const rows = chartData.map(d => [
      d.date,
      d.volume.toFixed(2),
      d.success,
      d.failed,
      d.avgTime.toFixed(2),
      d.p95Time.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpi-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success("Reporte CSV descargado");
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando KPIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/admin-dashboard")} 
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                KPIs Operativos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Métricas y alertas en tiempo real
              </p>
            </div>
            <Button onClick={fetchKPIData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Últimas 24h</SelectItem>
                    <SelectItem value="7d">Últimos 7 días</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Canal</label>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="MONCASH">MonCash</SelectItem>
                    <SelectItem value="SPIH">SPIH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Volumen Total</p>
                <p className="text-2xl font-bold">
                  ${kpis.totalVolume.toLocaleString('es-DO')} DOP
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                <p className="text-2xl font-bold">
                  {kpis.successRate.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-purple-600" />
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                <p className="text-2xl font-bold">
                  {kpis.avgDeliveryTime.toFixed(1)} min
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                {kpis.totalFailed > 0 && (
                  <Badge variant="destructive">{kpis.totalFailed}</Badge>
                )}
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Transacciones Fallidas</p>
                <p className="text-2xl font-bold">
                  {kpis.totalFailed}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="volume" className="space-y-4">
          <TabsList>
            <TabsTrigger value="volume">Volumen</TabsTrigger>
            <TabsTrigger value="success">Tasa de Éxito</TabsTrigger>
            <TabsTrigger value="channels">Por Canal</TabsTrigger>
            <TabsTrigger value="errors">Errores</TabsTrigger>
          </TabsList>

          <TabsContent value="volume" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Volumen Diario</CardTitle>
                <CardDescription>Volumen procesado por día</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString('es-DO')} DOP`} />
                    <Legend />
                    <Line type="monotone" dataKey="volume" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="success" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Éxito vs Fallos</CardTitle>
                <CardDescription>Transacciones exitosas vs fallidas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#10B981" />
                    <Bar dataKey="failed" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>P95 Tiempo de Entrega</CardTitle>
                  <CardDescription>95% de transacciones en menos de</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">
                      {kpis.p95DeliveryTime.toFixed(1)}
                    </p>
                    <p className="text-muted-foreground mt-2">minutos</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Transacciones</CardTitle>
                  <CardDescription>Periodo seleccionado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">
                      {kpis.totalTransactions}
                    </p>
                    <p className="text-muted-foreground mt-2">transacciones</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Volumen por Canal</CardTitle>
                <CardDescription>Distribución de volumen entre canales</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="volume"
                    >
                      {channelData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString('es-DO')} DOP`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Errores Top</CardTitle>
                <CardDescription>Errores más frecuentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topErrors.map((error, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">{error.error}</span>
                      <Badge variant="destructive">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas</CardTitle>
                <CardDescription>Alertas del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 border rounded-lg ${
                        alert.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                        alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                        'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString('es-DO')}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

