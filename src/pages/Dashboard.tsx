import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Send, Users, BarChart3 } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isAgente, isEmisor, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Remesas RD-Haití</h1>
            <p className="text-sm text-muted-foreground">Panel de Control</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">
            Bienvenido, {user?.email}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin && "Administrador del sistema"}
            {isAgente && !isAdmin && "Agente de remesas"}
            {isEmisor && !isAdmin && !isAgente && "Cliente"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isAgente && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Nueva Remesa
                </CardTitle>
                <CardDescription>
                  Procesa un nuevo envío de dinero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Crear Remesa</Button>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Gestión de Agentes
                  </CardTitle>
                  <CardDescription>
                    Administra tiendas y agentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Ver Agentes
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Reportes
                  </CardTitle>
                  <CardDescription>
                    Analítica y reportes del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Ver Reportes
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Mis Transacciones</CardTitle>
              <CardDescription>
                Historial de remesas enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Ver Historial
              </Button>
            </CardContent>
          </Card>
        </div>

        {!isAdmin && !isAgente && !isEmisor && (
          <Card className="mt-6 border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle>Acceso Pendiente</CardTitle>
              <CardDescription>
                Tu cuenta aún no tiene un rol asignado. Contacta al administrador para obtener acceso.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
