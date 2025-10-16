import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminMargins() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);

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

  if (authLoading || roleLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Márgenes de Plataforma</h1>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Margen Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0.00%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ganancias Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">RD$ 0.00</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ganancias Este Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">RD$ 0.00</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Márgenes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Configuración de márgenes por canal y corredor</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
