import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Users,
  ArrowLeft,
  Activity,
  Percent,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    // GMV (Gross Merchandise Value)
    gmv_today: 0,
    gmv_week: 0,
    gmv_month: 0,
    
    // Platform margins
    platform_margin_today: 0,
    platform_margin_week: 0,
    platform_margin_month: 0,
    
    // Agent commissions (total paid to stores)
    agent_commission_today: 0,
    agent_commission_week: 0,
    agent_commission_month: 0,
    
    // Transaction counts
    txn_count_today: 0,
    txn_count_week: 0,
    txn_count_month: 0,
    
    // Failed transactions
    failed_count_today: 0,
    failed_count_week: 0,
    failed_count_month: 0,
    
    // By channel
    moncash_volume: 0,
    spih_volume: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
      toast.error("Acceso denegado. Solo administradores.");
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchMetrics();
    }
  }, [user, isAdmin]);

  const fetchMetrics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);

      // Today metrics
      const { data: todayData } = await supabase
        .from("remittances")
        .select("principal_dop, platform_gross_margin_dop, comision_agente, state, channel")
        .gte("created_at", today.toISOString())
        .not("state", "eq", "FAILED");

      // Week metrics
      const { data: weekData } = await supabase
        .from("remittances")
        .select("principal_dop, platform_gross_margin_dop, comision_agente, state, channel")
        .gte("created_at", weekAgo.toISOString())
        .not("state", "eq", "FAILED");

      // Month metrics
      const { data: monthData } = await supabase
        .from("remittances")
        .select("principal_dop, platform_gross_margin_dop, comision_agente, state, channel")
        .gte("created_at", monthAgo.toISOString())
        .not("state", "eq", "FAILED");

      // Failed transactions
      const { data: failedToday } = await supabase
        .from("remittances")
        .select("id")
        .eq("state", "FAILED")
        .gte("created_at", today.toISOString());

      const { data: failedWeek } = await supabase
        .from("remittances")
        .select("id")
        .eq("state", "FAILED")
        .gte("created_at", weekAgo.toISOString());

      const { data: failedMonth } = await supabase
        .from("remittances")
        .select("id")
        .eq("state", "FAILED")
        .gte("created_at", monthAgo.toISOString());

      // Calculate metrics
      const calcMetrics = (data: any[]) => ({
        gmv: data?.reduce((sum, t) => sum + (t.principal_dop || 0), 0) || 0,
        platform: data?.reduce((sum, t) => sum + (t.platform_gross_margin_dop || 0), 0) || 0,
        agent: data?.reduce((sum, t) => sum + (t.comision_agente || 0), 0) || 0,
        count: data?.length || 0,
      });

      const todayMetrics = calcMetrics(todayData || []);
      const weekMetrics = calcMetrics(weekData || []);
      const monthMetrics = calcMetrics(monthData || []);

      // Channel breakdown (month)
      const moncashVolume = monthData?.filter(t => t.channel === 'MONCASH')
        .reduce((sum, t) => sum + (t.principal_dop || 0), 0) || 0;
      const spihVolume = monthData?.filter(t => t.channel === 'SPIH')
        .reduce((sum, t) => sum + (t.principal_dop || 0), 0) || 0;

      setMetrics({
        gmv_today: todayMetrics.gmv,
        gmv_week: weekMetrics.gmv,
        gmv_month: monthMetrics.gmv,
        platform_margin_today: todayMetrics.platform,
        platform_margin_week: weekMetrics.platform,
        platform_margin_month: monthMetrics.platform,
        agent_commission_today: todayMetrics.agent,
        agent_commission_week: weekMetrics.agent,
        agent_commission_month: monthMetrics.agent,
        txn_count_today: todayMetrics.count,
        txn_count_week: weekMetrics.count,
        txn_count_month: monthMetrics.count,
        failed_count_today: failedToday?.length || 0,
        failed_count_week: failedWeek?.length || 0,
        failed_count_month: failedMonth?.length || 0,
        moncash_volume: moncashVolume,
        spih_volume: spihVolume,
      });
    } catch (error: any) {
      console.error("Error fetching metrics:", error);
      toast.error("Error al cargar métricas");
    } finally {
      setLoading(false);
    }
  };

  const calculateTakeRate = (margin: number, gmv: number) => {
    if (gmv === 0) return 0;
    return ((margin / gmv) * 100);
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")} 
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Panel de Administración
              </h1>
              <p className="text-sm text-muted-foreground">
                Márgenes y Analítica de Plataforma
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="today">Hoy</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
          </TabsList>

          {/* TODAY */}
          <TabsContent value="today" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">GMV Hoy</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${metrics.gmv_today.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.txn_count_today} transacciones
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Margen Plataforma</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${metrics.platform_margin_today.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take rate: {calculateTakeRate(metrics.platform_margin_today, metrics.gmv_today).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Comisiones Tiendas</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${metrics.agent_commission_today.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pagado a agentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Transacciones Fallidas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {metrics.failed_count_today}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requieren revisión
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* WEEK */}
          <TabsContent value="week" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">GMV Semana</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${metrics.gmv_week.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.txn_count_week} transacciones
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Margen Plataforma</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${metrics.platform_margin_week.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take rate: {calculateTakeRate(metrics.platform_margin_week, metrics.gmv_week).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Comisiones Tiendas</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${metrics.agent_commission_week.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos 7 días
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Transacciones Fallidas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {metrics.failed_count_week}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos 7 días
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MONTH */}
          <TabsContent value="month" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">GMV Mes</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${metrics.gmv_month.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.txn_count_month} transacciones
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Margen Plataforma</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    ${metrics.platform_margin_month.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Take rate: {calculateTakeRate(metrics.platform_margin_month, metrics.gmv_month).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Comisiones Tiendas</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${metrics.agent_commission_month.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos 30 días
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Transacciones Fallidas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {metrics.failed_count_month}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos 30 días
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Channel breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Volumen por Canal (Mes)
                </CardTitle>
                <CardDescription>
                  Distribución de GMV por canal de pago
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">MonCash</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.gmv_month > 0 
                          ? ((metrics.moncash_volume / metrics.gmv_month) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${metrics.moncash_volume.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SPIH (Banco)</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics.gmv_month > 0 
                          ? ((metrics.spih_volume / metrics.gmv_month) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${metrics.spih_volume.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/transactions")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Ver Todas las Transacciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ir a Transacciones
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/stores")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Gestionar Tiendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ir a Tiendas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Configurar Tarifas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Próximamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
