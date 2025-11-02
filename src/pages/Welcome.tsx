import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-accent/30 bg-card/80 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-12 w-12 text-accent" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold text-accent">
              ¡Bienvenido a Kobcash!
            </CardTitle>
            <CardDescription className="text-lg">
              Tu cuenta ha sido creada exitosamente
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-accent/5 p-6 border border-accent/20">
            <p className="text-center text-muted-foreground mb-4">
              Ya puedes comenzar a enviar remesas a Haití de forma rápida y segura
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Envíos instantáneos</p>
                  <p className="text-sm text-muted-foreground">
                    Procesa tus remesas en minutos desde cualquier punto autorizado
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">100% Seguro</p>
                  <p className="text-sm text-muted-foreground">
                    Cumplimiento KYC/KYB y tecnología de encriptación
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Tasas competitivas</p>
                  <p className="text-sm text-muted-foreground">
                    Mejores tarifas y comisiones transparentes
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => navigate("/dashboard")} 
              className="flex-1"
              size="lg"
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                await signOut();
                window.location.href = '/';
              }}
              size="lg"
            >
              Cerrar Sesión
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Serás redirigido automáticamente en 5 segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;
