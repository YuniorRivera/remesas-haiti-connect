import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReconciliationUpload } from "@/components/ReconciliationUpload";
import { ReconciliationResults } from "@/components/ReconciliationResults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileCheck, FileX, TrendingUp } from "lucide-react";

export default function AdminReconciliation() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    reconciledToday: 0,
    totalVariance: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
    } else if (!roleLoading && isAdmin) {
      fetchReconciliations();
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reconciliations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReconciliations(data || []);

      // Calcular stats
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const today = new Date().toISOString().split('T')[0];
      const reconciledToday = data?.filter(r => 
        r.status === 'reconciled' && 
        r.processed_at?.startsWith(today)
      ).length || 0;
      const totalVariance = data?.reduce((sum, r) => 
        sum + (parseFloat(String(r.variance_dop)) || 0), 0
      ) || 0;

      setStats({ pending, reconciledToday, totalVariance });
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
      toast.error("Error al cargar reconciliaciones");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading || loading) {
    return <div>Cargando...</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Conciliación</h1>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Por Conciliar</CardTitle>
              <FileX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliadas Hoy</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.reconciledToday}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Variación Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${Math.abs(stats.totalVariance) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(stats.totalVariance)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Cargar Datos</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <ReconciliationUpload onComplete={fetchReconciliations} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {reconciliations.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No hay reconciliaciones registradas
                  </p>
                </CardContent>
              </Card>
            ) : (
              reconciliations.map((recon) => (
                <ReconciliationResults
                  key={recon.id}
                  reconciliation={recon}
                  onResolve={fetchReconciliations}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
