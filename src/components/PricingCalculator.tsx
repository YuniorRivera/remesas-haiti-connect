import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useLite } from "@/contexts/LiteModeContext";

interface PricingQuote {
  fx_client_sell: number;
  htg_to_beneficiary: number;
  total_client_fees_dop: number;
  total_client_pays_dop: number;
  gov_fee_dop: number;
  gov_fee_usd: number;
  channel: 'MONCASH' | 'SPIH';
}

export function PricingCalculator() {
  const { t } = useLocale();
  const isLite = useLite();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<PricingQuote | null>(null);

  // Get quote on amount change
  useEffect(() => {
    const fetchQuote = async () => {
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0 || numAmount > 1000000) {
        setQuote(null);
        return;
      }

      setLoading(true);
      try {
        // Call pricing-quote function as anonymous user
        const { data, error } = await supabase.functions.invoke('pricing-quote', {
          body: {
            principal_dop: numAmount,
            channel: 'MONCASH', // Default to MONCASH for public calculator
          },
        });

        if (error) throw error;
        if (data?.error) {
          console.error('Quote error:', data.error);
          setQuote(null);
        } else {
          setQuote(data as PricingQuote);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API call
    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(timer);
  }, [amount]);

  return (
    <Card className={`w-full ${isLite ? 'border border-primary/30' : 'border-primary/30 shadow-lg'}`}>
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {t("calculatorTitle") || "Calculadora de Remesas"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-base">
            {t("sendAmount") || "Monto a enviar"} (DOP)
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="Ej: 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
            min="0"
            max="1000000"
            aria-label={t("sendAmount") || "Monto a enviar en pesos dominicanos"}
          />
        </div>

        {loading && (
          <div className="text-center text-muted-foreground">
            {t("calculating") || "Calculando..."}
          </div>
        )}

        {quote && !loading && (
          <div className="space-y-4">
            {/* HTG Neto en Grande */}
            <div className={`rounded-lg p-6 text-center ${
              isLite 
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-300 dark:border-green-700'
            }`}>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {t("recipientWillReceive") || "El beneficiario recibirá"}
              </p>
              <p className={`text-5xl font-bold ${
                isLite ? 'text-green-700 dark:text-green-400' : 'text-green-600 dark:text-green-500'
              }`}>
                {quote.htg_to_beneficiary?.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} HTG
              </p>
            </div>

            {/* Desglose */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>1 DOP = {quote.fx_client_sell?.toFixed(4)} HTG</span>
                <span className="text-xs">{quote.channel}</span>
              </div>

              <div className="border-t pt-2 mt-2 space-y-2">
                <div className="flex justify-between">
                  <span>{t("kobcashFee") || "Comisión Kobcash"}:</span>
                  <span className="font-medium">
                    ${quote.total_client_fees_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t("governmentFee") || "Tarifa BRH"} (${quote.gov_fee_usd} USD):</span>
                  <span className="font-medium">
                    ${quote.gov_fee_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>

                <div className="border-t pt-2 flex justify-between font-semibold text-base">
                  <span>{t("totalToPay") || "Total a pagar"}:</span>
                  <span className="text-primary">
                    ${quote.total_client_pays_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!quote && !loading && amount && parseFloat(amount) > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {t("calculatorError") || "Error al calcular. Intente nuevamente."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

