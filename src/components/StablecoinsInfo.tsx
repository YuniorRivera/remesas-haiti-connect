import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Shield, Zap, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ENABLE_STABLECOINS = import.meta.env.VITE_ENABLE_STABLECOINS === 'true';

export function StablecoinsInfo() {
  // Don't render anything if flag is disabled
  if (!ENABLE_STABLECOINS) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Pagos con Stablecoins</CardTitle>
              <CardDescription>Próximamente: Envía remesas con USDC/USDT</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Próximamente
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Función Exploratoria</AlertTitle>
          <AlertDescription>
            Esta función está en fase de desarrollo. Solo para demostración.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
            <Zap className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Transacciones Instantáneas</h4>
              <p className="text-sm text-muted-foreground">
                Stablecoins permiten transferencias inmediatas sin demoras bancarias
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Bajo Costo</h4>
              <p className="text-sm text-muted-foreground">
                Sin comisiones intermedias, tarifas más bajas para el usuario final
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
            <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Estable</h4>
              <p className="text-sm text-muted-foreground">
                USDC/USDT pegged 1:1 al dólar, sin volatilidad
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Soportado:</strong> USDC (USD Coin), USDT (Tether)
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Conversión automática a HTG. Blockchain: Polygon, BSC, Arbitrum.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

