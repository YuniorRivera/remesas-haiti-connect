import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/lib/i18n";
import { SkipLinks } from "@/components/SkipLink";
import { Button } from "@/components/ui/button";
import { Send, Shield, Clock, TrendingUp } from "lucide-react";
import { PricingCalculator } from "@/components/PricingCalculator";
import { StatisticsDisplay } from "@/components/StatisticsDisplay";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { StablecoinsInfo } from "@/components/StablecoinsInfo";
import { Footer } from "@/components/Footer";
import { LanguageSelector } from "@/components/LanguageSelector";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-background.jpg"
            alt=""
            loading="eager"
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        </div>
        <header className="container mx-auto px-4 py-6 relative z-10" role="banner">
        <div className="flex items-center justify-between">
          <h1 
            className="text-2xl font-bold text-accent cursor-pointer"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate("/");
              }
            }}
            aria-label="Volver a Inicio"
          >
            kobcash
          </h1>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Button 
              onClick={() => navigate("/auth")} 
              variant="outline" 
              className="border-accent/50 hover:bg-accent/10 hover:border-accent"
              aria-label={`Ir a la página de inicio de sesión / ${t("signIn")}`}
            >
              {t("signIn")}
            </Button>
          </div>
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
              className="shadow-lg"
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
              className="rounded-lg border border-accent/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_72%_/_0.3)] hover:border-accent/60 hover:bg-card/70"
              role="listitem"
            >
              <Send 
                className="mb-4 h-10 w-10 text-accent drop-shadow-[0_0_8px_hsl(0_85%_72%_/_0.6)]"
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t("featureFast")}</h3>
              <p className="text-muted-foreground">
                {t("featureFastDesc")}
              </p>
            </article>

            <article 
              className="rounded-lg border border-accent/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_72%_/_0.3)] hover:border-accent/60 hover:bg-card/70"
              role="listitem"
            >
              <Shield 
                className="mb-4 h-10 w-10 text-accent drop-shadow-[0_0_8px_hsl(0_85%_72%_/_0.6)]"
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t("featureSecure")}</h3>
              <p className="text-muted-foreground">
                {t("featureSecureDesc")}
              </p>
            </article>

            <article 
              className="rounded-lg border border-accent/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_72%_/_0.3)] hover:border-accent/60 hover:bg-card/70"
              role="listitem"
            >
              <Clock 
                className="mb-4 h-10 w-10 text-accent drop-shadow-[0_0_8px_hsl(0_85%_72%_/_0.6)]"
                aria-hidden="true"
              />
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t("feature24h")}</h3>
              <p className="text-muted-foreground">
                {t("feature24hDesc")}
              </p>
            </article>

            <article 
              className="rounded-lg border border-accent/30 bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-[0_0_20px_hsl(0_85%_72%_/_0.3)] hover:border-accent/60 hover:bg-card/70"
              role="listitem"
            >
              <TrendingUp 
                className="mb-4 h-10 w-10 text-accent drop-shadow-[0_0_8px_hsl(0_85%_72%_/_0.6)]"
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

      <Footer />
      </div>
    </>
  );
};
export default Index;