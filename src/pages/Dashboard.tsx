import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/lib/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Send, Users, BarChart3, History } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isAgente, isEmisor, loading: roleLoading } = useUserRole(user?.id);
  const { language } = useLanguage();
  const { t } = useTranslation(language);

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
            <p className="text-sm text-muted-foreground">{t('dashboard')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">
            {t('welcome')}, {user?.email}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin && t('admin')}
            {isAgente && !isAdmin && t('agent')}
            {isEmisor && !isAdmin && !isAgente && t('sender')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isAgente && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  {t('newRemittance')}
                </CardTitle>
                <CardDescription>
                  Procesa un nuevo envío de dinero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">{t('create')}</Button>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {t('agentManagement')}
                  </CardTitle>
                  <CardDescription>
                    Administra tiendas y agentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate("/stores")}
                  >
                    Ver Tiendas
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t('reports')}
                  </CardTitle>
                  <CardDescription>
                    Analítica y reportes del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    {t('reports')}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                {t('myTransactions')}
              </CardTitle>
              <CardDescription>
                Historial de remesas enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate("/transactions")}
              >
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
