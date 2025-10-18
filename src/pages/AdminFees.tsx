import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminFees() {
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">Configuración de Tarifas</h1>
            <Badge variant="destructive" className="text-xs">Solo Admin</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Acceso restringido a administradores</p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tarifas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Gestión de matriz de tarifas (fees_matrix) por canal, corredor y montos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Cambios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No hay cambios registrados</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
