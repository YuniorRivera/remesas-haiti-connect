import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLite } from "@/contexts/LiteModeContext";
import { SkipLinks } from "@/components/SkipLink";
import { Button } from "@/components/ui/button";
import { Send, Shield, Clock, TrendingUp } from "lucide-react";
import ShinyText from "@/components/ShinyText";
const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLite = useLite();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <>
      <SkipLinks />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Red gradient overlay - hidden in lite mode */}
        {!isLite && (
          <div 
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_80%_15%_/_0.4),_hsl(0_0%_5%))] pointer-events-none hidden md:block"
            aria-hidden="true"
          />
        )}
        <header className="container mx-auto px-4 py-6 relative z-10" role="banner">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold text-primary ${isLite ? '' : 'md:drop-shadow-[0_0_10px_hsl(0_85%_50%_/_0.5)]'}`}>
            kobcash
          </h1>
          <Button 
            onClick={() => navigate("/auth")} 
            variant="outline" 
            className="border-primary/50 hover:bg-primary/10 hover:border-primary"
            aria-label="Ir a la página de inicio de sesión"
          >
            Iniciar Sesión
          </Button>
        </div>
      </header>

      <main id="main-content" className="relative z-10" role="main" tabIndex={-1}>
        <section className="container mx-auto px-4 py-20 text-center" aria-labelledby="hero-heading">
          {/* LCP element - prioritize loading */}
          <h2 id="hero-heading" className="mb-6 text-5xl font-bold tracking-tight">
            Envía dinero a Haití de forma{" "}
            {isLite ? (
              <span className="text-primary">rápida y segura</span>
            ) : (
              <ShinyText 
                text="rápida y segura" 
                speed={3}
                className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-5xl font-bold"
              />
            )}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Red de tiendas y colmados en República Dominicana para facilitar el envío
            de remesas a tus seres queridos en Haití.
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              className={isLite ? '' : 'shadow-lg'}
              aria-label="Comenzar a usar kobcash - ir a registro o inicio de sesión"
            >
              Comenzar Ahora
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              aria-label="Conocer más sobre kobcash"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Conocer Más
            </Button>
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-16" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Características principales</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" role="list">
            <article 
              className={`rounded-lg border border-primary/30 ${isLite ? 'bg-card p-6' : 'bg-card/50 md:backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70'}`}
              role="listitem"
            >
              <Send 
                className={`mb-4 h-10 w-10 text-primary ${isLite ? '' : 'md:drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]'}`}
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Envío Rápido</h3>
              <p className="text-muted-foreground">
                Procesa tus remesas en minutos desde cualquier punto autorizado
              </p>
            </article>

            <article 
              className={`rounded-lg border border-primary/30 ${isLite ? 'bg-card p-6' : 'bg-card/50 md:backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70'}`}
              role="listitem"
            >
              <Shield 
                className={`mb-4 h-10 w-10 text-primary ${isLite ? '' : 'md:drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]'}`}
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">100% Seguro</h3>
              <p className="text-muted-foreground">
                Cumplimiento KYC/KYB y tecnología de encriptación de última generación
              </p>
            </article>

            <article 
              className={`rounded-lg border border-primary/30 ${isLite ? 'bg-card p-6' : 'bg-card/50 md:backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70'}`}
              role="listitem"
            >
              <Clock 
                className={`mb-4 h-10 w-10 text-primary ${isLite ? '' : 'md:drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]'}`}
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Disponible 24/7</h3>
              <p className="text-muted-foreground">
                Accede a tu cuenta y consulta transacciones en cualquier momento
              </p>
            </article>

            <article 
              className={`rounded-lg border border-primary/30 ${isLite ? 'bg-card p-6' : 'bg-card/50 md:backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70'}`}
              role="listitem"
            >
              <TrendingUp 
                className={`mb-4 h-10 w-10 text-primary ${isLite ? '' : 'md:drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]'}`}
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">Mejor Tasa</h3>
              <p className="text-muted-foreground">
                Tasas de cambio competitivas y comisiones transparentes
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer 
        id="footer"
        className={`border-t border-primary/20 ${isLite ? 'bg-card py-8' : 'bg-card/30 md:backdrop-blur-sm py-8'} relative z-10`}
        role="contentinfo"
        tabIndex={-1}
      >
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">&copy; 2025 kobcash. Sistema seguro de transferencias.</p>
          <nav aria-label="Enlaces legales">
            <div className="flex justify-center gap-4">
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                onClick={() => navigate("/legal")}
                aria-label="Ver política de privacidad"
              >
                Política de Privacidad
              </Button>
              <span aria-hidden="true">•</span>
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                onClick={() => navigate("/legal")}
                aria-label="Ver términos y condiciones"
              >
                Términos y Condiciones
              </Button>
              <span aria-hidden="true">•</span>
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                onClick={() => navigate("/legal")}
                aria-label="Ver política de cookies"
              >
                Cookies
              </Button>
            </div>
          </nav>
        </div>
      </footer>
      </div>
    </>
  );
};
export default Index;