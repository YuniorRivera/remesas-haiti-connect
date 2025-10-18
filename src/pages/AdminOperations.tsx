import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminOperations() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [stats, setStats] = useState({
    today: 0,
    volume: 0,
    pending: 0,
    completed: 0,
  });
  const [recentRemittances, setRecentRemittances] = useState<any[]>([]);
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
      fetchOperations();
      // Suscribirse a actualizaciones en tiempo real
      const channel = supabase
        .channel('admin-operations')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'remittances'
          },
          () => {
            fetchOperations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Stats de hoy
      const { data: todayData, error: todayError } = await supabase
        .from('remittances')
        .select('principal_dop, state')
        .gte('created_at', today.toISOString());

      if (todayError) {
        console.error('Error fetching today stats:', todayError);
        toast.error('Error al cargar estadísticas de hoy');
      }

      // Actividad reciente
      const { data: recent, error: recentError } = await supabase
        .from('remittances')
        .select('*, agents(trade_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('Error fetching recent remittances:', recentError);
        toast.error('Error al cargar actividad reciente');
      }

      const todayCount = todayData?.length || 0;
      const volume = todayData?.reduce((sum, r) => sum + (r.principal_dop || 0), 0) || 0;
      const pending = todayData?.filter(r => r.state === 'CREATED' || r.state === 'QUOTED').length || 0;
      const completed = todayData?.filter(r => r.state === 'PAID').length || 0;

      setStats({
        today: todayCount,
        volume,
        pending,
        completed,
      });

      setRecentRemittances(recent || []);
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error('Error inesperado al cargar operaciones. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'PAID': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'CREATED': case 'QUOTED': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'FAILED': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'PAID': return 'Pagada';
      case 'CREATED': return 'Creada';
      case 'QUOTED': return 'Cotizada';
      case 'CONFIRMED': return 'Confirmada';
      case 'SENT': return 'Enviada';
      case 'FAILED': return 'Fallida';
      default: return state;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Operaciones en Tiempo Real</h1>
            <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Acceso restringido a administradores</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Remesas Hoy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.today}</p>
              <p className="text-xs text-muted-foreground mt-1">Transacciones procesadas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Volumen Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${stats.volume.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">DOP enviados hoy</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-muted-foreground mt-1">Esperando procesamiento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-xs text-muted-foreground mt-1">Pagadas exitosamente</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRemittances.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay operaciones recientes</p>
            ) : (
              <div className="space-y-3">
                {recentRemittances.map((rem) => (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/remittance/${rem.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold">{rem.codigo_referencia}</span>
                        <Badge variant="outline" className={getStateColor(rem.state)}>
                          {getStateLabel(rem.state)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rem.emisor_nombre} → {rem.beneficiario_nombre}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rem.agents?.trade_name} • {formatDistanceToNow(new Date(rem.created_at), { addSuffix: true, locale: es })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${(rem.principal_dop || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(rem.monto_recibido_htg || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
