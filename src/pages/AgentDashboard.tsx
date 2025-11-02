import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  Send, 
  TrendingUp, 
  History, 
  AlertTriangle,
  ArrowLeft 
} from "lucide-react";
import { toast } from "sonner";

const AgentDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAgent, loading: roleLoading } = useUserRole(user?.id);
  const [agent, setAgent] = useState<any>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !isAgent) {
      navigate("/dashboard");
      toast.error("Acceso denegado. Esta área es solo para agentes.");
    }
  }, [user, authLoading, isAgent, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAgent) {
      fetchAgentData();
    }
  }, [user, isAgent]);

  useEffect(() => {
    if (agentId) {
      fetchEarnings();
    }
  }, [agentId]);

  const fetchAgentData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("agent_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const agentId = profile?.agent_id || '';
      if (!agentId) {
        toast.error("No tienes una tienda asignada");
        return;
      }

      const { data: agentData, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .maybeSingle();

      if (error) throw error;
      setAgent(agentData);
      setAgentId(agentId);
    } catch (error: any) {
      toast.error("Error al cargar datos del agente");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);

      if (!agentId) return;

      // Ganancias de hoy
      const { data: todayData } = await supabase
        .from("remittances")
        .select("comision_agente")
        .eq("agent_id", agentId)
        .gte("created_at", today.toISOString());

      // Ganancias de la semana
      const { data: weekData } = await supabase
        .from("remittances")
        .select("comision_agente")
        .eq("agent_id", agentId)
        .gte("created_at", weekAgo.toISOString());

      // Ganancias del mes
      const { data: monthData } = await supabase
        .from("remittances")
        .select("comision_agente")
        .eq("agent_id", agentId)
        .gte("created_at", monthAgo.toISOString());

      setStats({
        today: todayData?.reduce((sum, t) => sum + (t.comision_agente || 0), 0) || 0,
        week: weekData?.reduce((sum, t) => sum + (t.comision_agente || 0), 0) || 0,
        month: monthData?.reduce((sum, t) => sum + (t.comision_agente || 0), 0) || 0,
      });
    } catch (error: any) {
      console.error("Error fetching earnings:", error);
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const lowBalance = agent?.float_balance_dop < 10000;
  const criticalBalance = agent?.float_balance_dop < 5000;

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
                {agent?.trade_name || agent?.legal_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Panel de Agente
              </p>
            </div>
            <Badge variant={agent?.is_active ? "default" : "secondary"}>
              {agent?.is_active ? "Activa" : "Inactiva"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Alertas */}
        {criticalBalance && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Saldo Crítico:</strong> Tu saldo es menor a $5,000 DOP. 
              Contacta al administrador para recargar tu float.
            </AlertDescription>
          </Alert>
        )}
        {lowBalance && !criticalBalance && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Saldo Bajo:</strong> Tu saldo es menor a $10,000 DOP. 
              Considera recargar pronto.
            </AlertDescription>
          </Alert>
        )}

        {/* Cards principales */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Saldo disponible */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Disponible
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(agent?.float_balance_dop || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                DOP disponibles para remesas
              </p>
            </CardContent>
          </Card>

          {/* Ganancia hoy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Ganancia Hoy
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${stats.today.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Comisiones del día
              </p>
            </CardContent>
          </Card>

          {/* Ganancia semana */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Ganancia Semana
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ${stats.week.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 7 días
              </p>
            </CardContent>
          </Card>

          {/* Ganancia mes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Ganancia Mes
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${stats.month.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 30 días
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/remittances/create")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Nuevo Envío
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Procesa una nueva remesa a Haití
              </p>
              <Button className="w-full">
                Crear Remesa
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/transactions")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ver todas tus transacciones
              </p>
              <Button variant="outline" className="w-full">
                Ver Historial
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Reportes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analítica y estadísticas
              </p>
              <Button variant="outline" className="w-full">
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AgentDashboard;
