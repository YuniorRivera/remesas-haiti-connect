import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRemittanceForm } from "@/hooks/useRemittanceForm";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { RemittanceReceipt } from "@/components/RemittanceReceipt";
import { logger } from "@/lib/logger";
import { PageHeader } from "@/components/ui/page-header";
import { StepIndicator } from "@/components/ui/step-indicator";

type Step = 1 | 2 | 3 | 4;

export default function CreateRemittance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLocale();
  const [step, setStep] = useState<Step>(1);
  const [agentName, setAgentName] = useState<string>("");

  // Use custom hook for remittance form logic
  const {
    formData,
    updateField,
    quote,
    feesAvailable,
    confirmedRemittance,
    loading,
    getQuote,
    createRemittance,
    confirmRemittance,
  } = useRemittanceForm();

  useEffect(() => {
    const fetchAgentInfo = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('agent_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          logger.error('Error fetching profile:', profileError);
          toast.error(t('errorLoadingAgentInfo'));
          return;
        }

        if (!profile?.agent_id) {
          toast.warning(t('noStoreAssigned'));
          return;
        }

        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .select('trade_name')
          .eq('id', profile.agent_id)
          .maybeSingle();
        
        if (agentError) {
          logger.error('Error fetching agent:', agentError);
          return;
        }

        if (agent?.trade_name) {
          setAgentName(agent.trade_name);
        }
      } catch {
        logger.error('Unexpected error fetching agent info');
        toast.error(t('unexpectedErrorLoadingInfo'));
      }
    };

    fetchAgentInfo();
  }, [user]);

  // Handlers that use the hook
  const handleGetQuote = async () => {
    const pricingQuote = await getQuote();
    if (pricingQuote) {
      setStep(3);
    }
  };

  const handleCreateRemittance = async () => {
    const remittance = await createRemittance();
    if (remittance) {
      setStep(4);
    }
  };

  const handleConfirmRemittance = async () => {
    const remittance = await confirmRemittance();
    if (remittance) {
      setStep(4);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHeader
        title={t("createRemittance")}
        backUrl="/agent-dashboard"
        backLabel={t("backToDashboard")}
      />

      <main className="container mx-auto p-6 max-w-2xl">
        <StepIndicator currentStep={step} totalSteps={4} />

        {/* Paso 1: Datos del Emisor */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("senderData")}</CardTitle>
              <CardDescription>
                {t("senderDataDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emisor_nombre">{t("fullNameRequired")}</Label>
                <Input
                  id="emisor_nombre"
                  value={formData.emisor_nombre}
                  onChange={(e) => updateField("emisor_nombre", e.target.value)}
                  placeholder={t("fullName")}
                />
              </div>
              <div>
                <Label htmlFor="emisor_telefono">{t("phone")}</Label>
                <Input
                  id="emisor_telefono"
                  value={formData.emisor_telefono}
                  onChange={(e) => updateField("emisor_telefono", e.target.value)}
                  placeholder="809-123-4567"
                />
              </div>
              <div>
                <Label htmlFor="emisor_documento">{t("identityDocument")}</Label>
                <Input
                  id="emisor_documento"
                  value={formData.emisor_documento}
                  onChange={(e) => updateField("emisor_documento", e.target.value)}
                  placeholder="001-1234567-8"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.emisor_nombre}
                className="w-full"
              >
                {t("continue")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paso 2: Datos del Beneficiario y Monto */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("beneficiaryData")}</CardTitle>
              <CardDescription>
                {t("beneficiaryDataDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="beneficiario_nombre">{t("fullNameRequired")}</Label>
                <Input
                  id="beneficiario_nombre"
                  value={formData.beneficiario_nombre}
                  onChange={(e) => updateField("beneficiario_nombre", e.target.value)}
                  placeholder={t("fullName")}
                />
              </div>
              <div>
                <Label htmlFor="beneficiario_telefono">{t("phoneHaiti")}</Label>
                <Input
                  id="beneficiario_telefono"
                  value={formData.beneficiario_telefono}
                  onChange={(e) => updateField("beneficiario_telefono", e.target.value)}
                  placeholder="+509 3712-3456"
                />
              </div>
              <div>
                <Label htmlFor="payout_city">{t("withdrawalCity")}</Label>
                <Input
                  id="payout_city"
                  value={formData.payout_city}
                  onChange={(e) => updateField("payout_city", e.target.value)}
                  placeholder="Puerto Príncipe / Pòtoprens"
                />
              </div>
              <div>
                <Label htmlFor="principal_dop">{t("amountToSend")}</Label>
                <Input
                  id="principal_dop"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.principal_dop}
                  onChange={(e) => updateField("principal_dop", e.target.value)}
                  placeholder="10000.00"
                />
              </div>
              <div>
                <Label htmlFor="channel">{t("paymentChannel")}</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => updateField("channel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONCASH">MonCash</SelectItem>
                    <SelectItem value="SPIH">SPIH (Banco)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  {t("back")}
                </Button>
                <Button
                  onClick={handleGetQuote}
                  disabled={
                    !formData.beneficiario_nombre ||
                    !formData.beneficiario_telefono ||
                    !formData.principal_dop ||
                    loading
                  }
                  className="flex-1"
                >
                  {loading ? t("gettingQuote") : t("quote")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 3: Cotización */}
        {step === 3 && quote && (
          <Card>
            <CardHeader>
              <CardTitle>{t("detailedQuote")}</CardTitle>
              <CardDescription>
                {t("reviewCalculations")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Paso 1: Monto y Fees al Cliente */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">1. {t("amountAndFees")}</h3>
                <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>{t("principalAmount")}:</span>
                    <span className="font-medium">
                      ${parseFloat(formData.principal_dop).toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="pl-4">• {t("fixedFee")}:</span>
                    <span>${quote.client_fee_fixed_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="pl-4">• {t("percentageFee")}:</span>
                    <span>${quote.client_fee_pct_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("totalFees")}:</span>
                    <span className="font-medium">
                      ${quote.total_client_fees_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                </div>
              </div>

              {/* Paso 2: Fee Gubernamental */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">2. {t("governmentFeeBRH")}</h3>
                <div className="space-y-2 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>{t("governmentFee")} (${quote.gov_fee_usd} USD):</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      ${quote.gov_fee_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                </div>
              </div>

              {/* Paso 3: Total a Pagar */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">3. {t("totalClientPays")}</h3>
                <div className="space-y-2 bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                  <div className="flex justify-between text-base font-bold">
                    <span>{t("totalToPay")}:</span>
                    <span className="text-primary text-lg">
                      ${quote.total_client_pays_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                </div>
              </div>

              {/* Paso 4: Conversión FX */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">4. {t("conversionToGourdes")}</h3>
                <div className="space-y-2 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>{t("clientExchangeRate")}:</span>
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      1 DOP = {quote.fx_client_sell?.toFixed(4)} HTG
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="pl-4">{t("htgBeforePartnerFee")}:</span>
                    <span>{quote.htg_before_partner?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="pl-4">• {t("partnerFee")}:</span>
                    <span>-{quote.partner_fee_htg?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG</span>
                  </div>
                </div>
              </div>

              {/* Paso 5: Monto Final al Beneficiario */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">5. {t("htgToBeneficiary")}</h3>
                <div className="space-y-2 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border-2 border-green-500/20">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-green-800 dark:text-green-400">{t("beneficiaryReceives")}:</span>
                    <span className="text-green-600 dark:text-green-400 text-lg">
                      {quote.htg_to_beneficiary?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    {t("channel")}: {formData.channel === 'MONCASH' ? 'MonCash' : 'SPIH'}
                  </div>
                </div>
              </div>

              {/* Comisión del Agente */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary">{t("yourCommission")}</h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-between">
                    <span className="font-medium text-green-800 dark:text-green-400">{t("profitThisTransaction")}:</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                      ${quote.store_commission_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalles Administrativos (solo para admin) */}
              {quote.platform_gross_margin_dop !== undefined && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-primary">{t("administrativeDetails")}</h3>
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-lg text-xs">
                    <div className="flex justify-between">
                      <span>{t("platformGrossMargin")}:</span>
                      <span className={quote.platform_gross_margin_dop > 0 ? "text-green-600" : "text-red-600"}>
                        ${quote.platform_gross_margin_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="pl-4">• {t("totalRevenue")}:</span>
                      <span>${quote.total_platform_revenue?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="pl-4">• {t("totalCosts")}:</span>
                      <span>${quote.total_costs?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span className="pl-4">• {t("fxSpreadRevenue")}:</span>
                      <span>${quote.fx_spread_rev_dop?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  {t("modify")}
                </Button>
                <Button
                  onClick={handleCreateRemittance}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? t("creating") : t("confirmShipment")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 4: Confirmación y Recibo */}
        {step === 4 && confirmedRemittance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-6 w-6" />
                {t("remittanceConfirmed")}
              </CardTitle>
              <CardDescription>
                {t("remittanceConfirmedDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RemittanceReceipt 
                remittance={confirmedRemittance}
                agentName={agentName}
              />
              
              <div className="mt-6">
                <Button
                  onClick={() => navigate("/transactions")}
                  variant="outline"
                  className="w-full"
                >
                  {t("viewTransactions")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Paso 4 alternativo: Solo cotización creada */}
        {step === 4 && !confirmedRemittance && quote && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-6 w-6" />
                {t("remittanceCreated")}
              </CardTitle>
              <CardDescription>
                {t("remittanceCreatedDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("referenceCode")}:</span>
                  <span className="font-mono font-bold">{quote?.remittance?.codigo_referencia}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("sender")}:</span>
                  <span>{formData.emisor_nombre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("recipient")}:</span>
                  <span>{formData.beneficiario_nombre}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("amountToReceive")}:</span>
                  <span className="font-bold text-secondary">
                    {quote?.htg_to_beneficiary?.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                  </span>
                </div>
              </div>

              <Button
                onClick={handleConfirmRemittance}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? t("processing") : t("confirmAndSend")}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/agent-dashboard")}
                className="w-full"
              >
                {t("backToDashboard")}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
