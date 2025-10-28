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
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isAgent, isComplianceOfficer, isSenderUser, loading: roleLoading } = useUserRole(user?.id);
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    // If user is authenticated but has no role, redirect to onboarding
    if (!roleLoading && user && !isAdmin && !isAgent && !isComplianceOfficer && !isSenderUser) {
      navigate("/onboarding");
      return;
    }

    // Salvaguarda: Si es sender_user, verificar que el perfil esté completo
    const checkProfileCompletion = async () => {
      if (!roleLoading && isSenderUser && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        const isComplete = Boolean(
          profile?.full_name && 
          profile?.phone && 
          profile.full_name.trim() && 
          profile.phone.trim()
        );

        if (!isComplete) {
          console.log("⚠️ Sender user with incomplete profile, redirecting to onboarding");
          navigate("/onboarding/sender");
        }
      }
    };

    checkProfileCompletion();
  }, [user, authLoading, roleLoading, isAdmin, isAgent, isComplianceOfficer, isSenderUser, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
            {isComplianceOfficer && !isAdmin && 'Oficial de Cumplimiento'}
            {isAgent && !isAdmin && !isComplianceOfficer && t('agent')}
            {isSenderUser && !isAdmin && !isAgent && !isComplianceOfficer && t('sender')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isAgent && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Panel de Agente
                </CardTitle>
                <CardDescription>
                  Gestiona tu tienda y procesa remesas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => navigate("/agent-dashboard")}
                >
                  Ir al Panel
                </Button>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Panel de Admin
                  </CardTitle>
                  <CardDescription>
                    Márgenes, GMV y analítica de plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => navigate("/admin-dashboard")}
                  >
                    Ver Métricas
                  </Button>
                </CardContent>
              </Card>

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

          {isSenderUser && !isAdmin && !isAgent && (
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Enviar Dinero
                </CardTitle>
                <CardDescription>
                  Cotiza y envía dinero a Haití
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => navigate("/send")}
                >
                  Iniciar Envío
                </Button>
              </CardContent>
            </Card>
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

        {!isAdmin && !isAgent && !isComplianceOfficer && !isSenderUser && (
          <Card className="mt-6 border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle>Acceso Pendiente</CardTitle>
              <CardDescription>
                Tu cuenta aún no tiene un rol asignado. Contacta al administrador para obtener acceso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="w-full"
              >
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
