import { useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLite } from "@/contexts/LiteModeContext";
import { useLocale } from "@/lib/i18n";
import { SkipLinks } from "@/components/SkipLink";
import { Button } from "@/components/ui/button";
import { Send, Shield, Clock, TrendingUp } from "lucide-react";
import { PricingCalculator } from "@/components/PricingCalculator";
import { StatisticsDisplay } from "@/components/StatisticsDisplay";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { StablecoinsInfo } from "@/components/StablecoinsInfo";

// Lazy load heavy p5.js animation only when needed
const HeroBackground = lazy(() => import("@/components/animations/HeroBackground").then(module => ({ default: module.HeroBackground })));

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLite = useLite();
  const { t } = useLocale();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <>
      <SkipLinks />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* P5.js animated background - hidden in lite mode, lazy loaded for performance */}
        {!isLite && (
          <Suspense fallback={null}>
            <HeroBackground />
          </Suspense>
        )}
        
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
            aria-label={`Ir a la página de inicio de sesión / ${t("signIn")}`}
          >
            {t("signIn")}
          </Button>
        </div>
      </header>

      <main id="main-content" className="relative z-10" role="main" tabIndex={-1}>
        <section className="container mx-auto px-4 py-20 text-center" aria-labelledby="hero-heading">
          {/* LCP element - prioritize loading */}
          <h2 id="hero-heading" className="mb-6 text-5xl font-bold tracking-tight">
            {t("heroTitle")}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            {t("heroSubtitle")}
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => navigate("/auth")} 
              size="lg" 
              className={isLite ? '' : 'shadow-lg'}
              aria-label={`${t("ctaPrimary")} - ir a registro o inicio de sesión`}
            >
              {t("ctaPrimary")}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              aria-label={t("ctaSecondary")}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t("ctaSecondary")}
            </Button>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="container mx-auto px-4 py-12" aria-labelledby="calculator-heading">
          <div className="max-w-2xl mx-auto space-y-8">
            <PricingCalculator />
            <StablecoinsInfo />
          </div>
        </section>

        {/* Statistics Section */}
        <section className="container mx-auto px-4 py-16" aria-labelledby="statistics-heading">
          <h2 id="statistics-heading" className="text-3xl font-bold text-center mb-8">
            {t('trustMetrics') || "Confianza que Habla por Sí Misma"}
          </h2>
          <StatisticsDisplay />
        </section>

        <section id="features" className="container mx-auto px-4 py-16" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">{t("features")}</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" role="list">
            <article 
              className={`rounded-lg border border-primary/30 ${isLite ? 'bg-card p-6' : 'bg-card/50 md:backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_50%_/_0.3)] hover:border-primary/60 hover:bg-card/70'}`}
              role="listitem"
            >
              <Send 
                className={`mb-4 h-10 w-10 text-primary ${isLite ? '' : 'md:drop-shadow-[0_0_8px_hsl(0_85%_50%_/_0.6)]'}`}
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t("featureFast")}</h3>
              <p className="text-muted-foreground">
                {t("featureFastDesc")}
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
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t("featureSecure")}</h3>
              <p className="text-muted-foreground">
                {t("featureSecureDesc")}
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
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t("feature24h")}</h3>
              <p className="text-muted-foreground">
                {t("feature24hDesc")}
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
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t("featureBest")}</h3>
              <p className="text-muted-foreground">
                {t("featureBestDesc")}
              </p>
            </article>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 py-16" aria-labelledby="testimonials-heading">
          <h2 id="testimonials-heading" className="text-3xl font-bold text-center mb-8">
            {t('whatOurUsersSay') || "Lo que Dicen Nuestros Usuarios"}
          </h2>
          <div className="max-w-3xl mx-auto">
            <TestimonialsCarousel />
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
          <p className="mb-2">{t("copyright")}</p>
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