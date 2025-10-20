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
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Red gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_80%_15%_/_0.4),_hsl(0_0%_5%))] pointer-events-none" />
      <header className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary drop-shadow-[0_0_10px_hsl(0_85%_50%_/_0.5)]">kobcash</h1>
          <Button onClick={() => navigate("/auth")} variant="outline" className="border-primary/50 hover:bg-primary/10 hover:border-primary">
            Iniciar Sesión
          </Button>
        </div>
      </header>

      <main className="relative z-10">
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
            <div className="rounded-lg border border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70">
              <Send className="mb-4 h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Envío Rápido</h3>
              <p className="text-muted-foreground">
                Procesa tus remesas en minutos desde cualquier punto autorizado
              </p>
            </div>

            <div className="rounded-lg border border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70">
              <Shield className="mb-4 h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">100% Seguro</h3>
              <p className="text-muted-foreground">
                Cumplimiento KYC/KYB y tecnología de encriptación de última generación
              </p>
            </div>

            <div className="rounded-lg border border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70">
              <Clock className="mb-4 h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Disponible 24/7</h3>
              <p className="text-muted-foreground">
                Accede a tu cuenta y consulta transacciones en cualquier momento
              </p>
            </div>

            <div className="rounded-lg border border-primary/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70">
              <TrendingUp className="mb-4 h-10 w-10 text-primary drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]" />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Mejor Tasa</h3>
              <p className="text-muted-foreground">
                Tasas de cambio competitivas y comisiones transparentes
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-primary/20 bg-card/30 backdrop-blur-sm py-8 relative z-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">&copy; 2025 kobcash. Sistema seguro de transferencias.</p>
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