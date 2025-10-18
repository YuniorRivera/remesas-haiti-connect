import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Send, Shield, Clock, TrendingUp } from "lucide-react";
import ShinyText from "@/components/ShinyText";
const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Remesas RD-Haití</h1>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Iniciar Sesión
          </Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="mb-6 text-5xl font-bold tracking-tight">
            Envía dinero a Haití de forma{" "}
            <ShinyText 
              text="rápida y segura" 
              speed={3}
              className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-5xl font-bold"
            />
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Red de tiendas y colmados en República Dominicana para facilitar el envío
            de remesas a tus seres queridos en Haití.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => navigate("/auth")} size="lg" className="shadow-lg">
              Comenzar Ahora
            </Button>
            <Button variant="outline" size="lg">
              Conocer Más
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <Send className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Envío Rápido</h3>
              <p className="text-muted-foreground">
                Procesa tus remesas en minutos desde cualquier punto autorizado
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <Shield className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">100% Seguro</h3>
              <p className="text-muted-foreground">
                Cumplimiento KYC/KYB y tecnología de encriptación de última generación
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <Clock className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Disponible 24/7</h3>
              <p className="text-muted-foreground">
                Accede a tu cuenta y consulta transacciones en cualquier momento
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <TrendingUp className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Mejor Tasa</h3>
              <p className="text-muted-foreground">
                Tasas de cambio competitivas y comisiones transparentes
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">&copy; 2025 Remesas RD-Haití. Sistema seguro de transferencias.</p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={() => navigate("/legal")}
            >
              Política de Privacidad
            </Button>
            <span>•</span>
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={() => navigate("/legal")}
            >
              Términos y Condiciones
            </Button>
            <span>•</span>
            <Button 
              variant="link" 
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
              onClick={() => navigate("/legal")}
            >
              Cookies
            </Button>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;