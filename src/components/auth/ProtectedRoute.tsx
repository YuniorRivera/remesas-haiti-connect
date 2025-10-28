import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

type AppRole = "admin" | "agent_owner" | "agent_clerk" | "compliance_officer" | "sender_user";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: AppRole[];
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  allowedRoles 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole(user?.id);

  const needsRoleCheck = !!(allowedRoles && allowedRoles.length > 0);

  useEffect(() => {
    if (!authLoading && requireAuth && !user) {
      navigate("/auth");
    }
  }, [authLoading, requireAuth, user, navigate]);

  // Logs para diagnóstico
  useEffect(() => {
    console.log("🔒 ProtectedRoute state", {
      authLoading,
      hasUser: !!user,
      needsRoleCheck,
      roleLoading,
      roles
    });
  }, [authLoading, user, needsRoleCheck, roleLoading, roles]);

  // Mostrar loader SOLO si auth carga o si necesitamos roles y estos cargan
  if (authLoading || (requireAuth && user && needsRoleCheck && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (needsRoleCheck) {
    const hasAllowedRole = roles.some(role => allowedRoles!.includes(role));
    
    if (!hasAllowedRole) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" />
                Acceso Denegado
              </CardTitle>
              <CardDescription>
                No tienes los permisos necesarios para acceder a esta página.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}
