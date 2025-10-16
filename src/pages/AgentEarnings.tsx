import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentEarnings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAgent, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAgent) {
      navigate("/dashboard");
    }
  }, [isAgent, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Ganancias de Tienda</h1>
        
        <div className="grid gap-6 md:grid-cols-3 mb-6">
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
          
          <Card>
            <CardHeader>
              <CardTitle>Total Comisiones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">RD$ 0.00</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Ganancias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
