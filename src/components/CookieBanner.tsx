import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { Link } from "react-router-dom";

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Delay to avoid interfering with initial page load
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptNecessary = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({
      necessary: true,
      analytics: false,
      date: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  const acceptAll = () => {
    localStorage.setItem("cookie-consent", JSON.stringify({
      necessary: true,
      analytics: true,
      date: new Date().toISOString()
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="mx-auto max-w-4xl border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Uso de Cookies</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Usamos cookies <strong>necesarias</strong> para el funcionamiento básico del sitio 
                (autenticación, seguridad, preferencias de idioma). Las cookies de <strong>analytics</strong> 
                son opcionales y nos ayudan a mejorar tu experiencia.{" "}
                <Link to="/legal" className="text-primary hover:underline">
                  Ver política de cookies
                </Link>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={acceptNecessary}
                  variant="outline"
                  size="sm"
                >
                  Solo Necesarias
                </Button>
                <Button 
                  onClick={acceptAll}
                  size="sm"
                >
                  Aceptar Todas
                </Button>
                <Button
                  onClick={() => setShowBanner(false)}
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Al continuar usando este sitio, aceptas nuestra política de privacidad y el uso de cookies necesarias.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
