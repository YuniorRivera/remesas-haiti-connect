import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2, ChevronLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WizardStep = 1 | 2 | 3;
type UpgradeStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
type PrismOptIn = boolean;

interface PrismStatus {
  upgrade_status: UpgradeStatus;
  prism_opt_in: PrismOptIn;
  prism_authorized_at: string | null;
  upgrade_completed_at: string | null;
  upgrade_failed_reason: string | null;
}

export default function MonCashPlusWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLocale();
  
  const beneficiaryPhone = searchParams.get('phone') || '';
  const beneficiaryName = searchParams.get('name') || 'Usuario';
  const returnUrl = searchParams.get('return') || '/send';

  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PrismStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    if (beneficiaryPhone) {
      fetchStatus();
    } else {
      toast.error(t('prismPhoneRequired') || "Teléfono del beneficiario requerido");
      navigate(returnUrl);
    }
  }, [beneficiaryPhone]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('beneficiary_prism_status')
        .select('*')
        .eq('beneficiary_phone', beneficiaryPhone)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setStatus(data as PrismStatus);
        // Auto-advance based on status
        if (data.upgrade_status === 'completed' && data.prism_opt_in) {
          setStep(3);
        } else if (data.upgrade_status === 'completed') {
          setStep(2);
        }
      } else {
        // Create new status record
        const { error: insertError } = await supabase
          .from('beneficiary_prism_status')
          .insert({
            beneficiary_phone: beneficiaryPhone,
            beneficiary_name: beneficiaryName,
            upgrade_status: 'pending',
            prism_opt_in: false,
          });

        if (insertError) throw insertError;
        
        const { data: newData } = await supabase
          .from('beneficiary_prism_status')
          .select('*')
          .eq('beneficiary_phone', beneficiaryPhone)
          .single();
        
        setStatus(newData as PrismStatus);
      }
    } catch (error: any) {
      console.error('Error fetching PRISM status:', error);
      toast.error(t('prismErrorLoading') || "Error al cargar estado");
    } finally {
      setLoading(false);
    }
  };

  const handleStartUpgrade = async () => {
    setConfirmDialog(false);
    setChecking(true);

    try {
      // Update status to in_progress
      const { error } = await supabase
        .from('beneficiary_prism_status')
        .update({ upgrade_status: 'in_progress' })
        .eq('beneficiary_phone', beneficiaryPhone);

      if (error) throw error;

      // In production, this would call MonCash API
      // For now, simulate completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: completeError } = await supabase
        .from('beneficiary_prism_status')
        .update({
          upgrade_status: 'completed',
          upgrade_completed_at: new Date().toISOString(),
        })
        .eq('beneficiary_phone', beneficiaryPhone);

      if (completeError) throw completeError;

      toast.success(t('prismUpgradeCompleted') || "Upgrade a MonCash Plus completado");
      fetchStatus();
      setStep(2);
    } catch (error: any) {
      console.error('Error in upgrade:', error);
      
      await supabase
        .from('beneficiary_prism_status')
        .update({
          upgrade_status: 'failed',
          upgrade_failed_reason: error.message || "Error desconocido",
        })
        .eq('beneficiary_phone', beneficiaryPhone);

      toast.error(t('prismUpgradeFailed') || "Error en upgrade. Intenta nuevamente.");
      fetchStatus();
    } finally {
      setChecking(false);
    }
  };

  const handleStartPrismOptIn = async () => {
    setChecking(true);

    try {
      // In production, this would call MonCash PRISM API
      // For now, simulate completion
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from('beneficiary_prism_status')
        .update({
          prism_opt_in: true,
          prism_authorized_at: new Date().toISOString(),
        })
        .eq('beneficiary_phone', beneficiaryPhone);

      if (error) throw error;

      toast.success(t('prismOptInCompleted') || "Autorización PRISM completada");
      fetchStatus();
      setStep(3);
    } catch (error: any) {
      console.error('Error in PRISM opt-in:', error);
      toast.error(t('prismOptInFailed') || "Error en autorización. Intenta nuevamente.");
    } finally {
      setChecking(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;

    if (status.upgrade_status === 'completed' && status.prism_opt_in) {
      return <Badge className="bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" />Completo</Badge>;
    } else if (status.upgrade_status === 'completed') {
      return <Badge className="bg-yellow-600"><AlertCircle className="h-3 w-3 mr-1" />Upgrade Completo</Badge>;
    } else if (status.upgrade_status === 'in_progress') {
      return <Badge className="bg-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />En Proceso</Badge>;
    } else if (status.upgrade_status === 'failed') {
      return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
    }
    return <Badge variant="secondary">Pendiente</Badge>;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-muted/30 p-4">
        <div className="max-w-3xl mx-auto py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {t('moncashPlusTitle') || "MonCash Plus + PRISM"}
                  </CardTitle>
                  <CardDescription>
                    {t('moncashPlusDesc') || "Upgrade y autorización requerida para recibir remesas"}
                  </CardDescription>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent>
              {/* Beneficiary Info */}
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('beneficiary') || "Beneficiario"}
                </p>
                <p className="font-semibold">{beneficiaryName}</p>
                <p className="text-sm text-muted-foreground">{beneficiaryPhone}</p>
              </div>

              {/* Step 1: Upgrade to MonCash Plus */}
              {step === 1 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('moncashStep1Title') || "Paso 1: Upgrade a MonCash Plus"}</AlertTitle>
                    <AlertDescription>
                      {t('moncashStep1Desc') || "El beneficiario debe tener una cuenta MonCash Plus activa para recibir remesas directamente en su billetera."}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-semibold">{t('howToUpgrade') || "Cómo hacer el upgrade:"}</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>{t('moncashStep1a') || "Abrir la app MonCash"}</li>
                      <li>{t('moncashStep1b') || "Ir a Configuración → Upgrade"}</li>
                      <li>{t('moncashStep1c') || "Verificar identidad (cédula/pasaporte)"}</li>
                      <li>{t('moncashStep1d') || "Completar proceso de verificación"}</li>
                    </ol>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={() => setConfirmDialog(true)}
                      disabled={checking || status?.upgrade_status === 'in_progress'}
                      className="w-full"
                    >
                      {status?.upgrade_status === 'completed' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t('upgradeCompleted') || "Upgrade Completado"}
                        </>
                      ) : (
                        <>
                          {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                          {checking ? (t('processing') || "Procesando...") : (t('iCompletedUpgrade') || "Ya completé el upgrade")}
                        </>
                      )}
                    </Button>

                    {status?.upgrade_status === 'failed' && (
                      <Alert className="mt-4 border-red-500">
                        <AlertDescription className="text-red-700">
                          {status.upgrade_failed_reason || t('upgradeFailed') || "Error en upgrade"}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: PRISM Opt-in */}
              {step === 2 && status?.upgrade_status === 'completed' && (
                <div className="space-y-4">
                  <Alert className="border-green-500">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">
                      {t('moncashStep2Title') || "Upgrade Completado ✓"}
                    </AlertTitle>
                    <AlertDescription>
                      {t('moncashStep2Pre') || "Ahora autoriza PRISM para recibir remesas"}
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('prismOptInTitle') || "Paso 2: Autorizar PRISM (Opt-in)"}</AlertTitle>
                    <AlertDescription>
                      {t('prismOptInDesc') || "PRISM permite que remesas externas ingresen directamente a la billetera MonCash. El beneficiario debe autorizar esto en la app."}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <h4 className="font-semibold">{t('howToAuthorize') || "Cómo autorizar PRISM:"}</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>{t('prismStep2a') || "Abrir la app MonCash Plus"}</li>
                      <li>{t('prismStep2b') || "Ir a Configuración → Remesas"}</li>
                      <li>{t('prismStep2c') || "Habilitar 'Autorizar Remesas Externas (PRISM)'"}</li>
                      <li>{t('prismStep2d') || "Confirmar con PIN o huella"}</li>
                    </ol>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button
                      onClick={handleStartPrismOptIn}
                      disabled={checking || status.prism_opt_in}
                      className="w-full"
                    >
                      {status.prism_opt_in ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t('prismAuthorized') || "PRISM Autorizado"}
                        </>
                      ) : (
                        <>
                          {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                          {checking ? (t('processing') || "Procesando...") : (t('iAuthorizedPrism') || "Ya autoricé PRISM")}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="w-full"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      {t('back') || "Atrás"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Complete */}
              {step === 3 && status?.prism_opt_in && (
                <div className="space-y-4">
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700 text-lg">
                      {t('moncashCompleteTitle') || "¡Todo Listo! ✓"}
                    </AlertTitle>
                    <AlertDescription className="text-green-700">
                      {t('moncashCompleteDesc') || "El beneficiario está listo para recibir remesas directamente en MonCash Plus."}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3 bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('upgradeStatus') || "Estado Upgrade:"}</span>
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('completed') || "Completado"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('prismStatus') || "Estado PRISM:"}</span>
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('authorized') || "Autorizado"}
                      </Badge>
                    </div>
                    {status.prism_authorized_at && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t('authorizedAt') || "Autorizado:"}</span>
                        <span>{new Date(status.prism_authorized_at).toLocaleString('es-DO')}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => navigate(returnUrl)}
                    className="w-full"
                  >
                    {t('continueRemittance') || "Continuar con Remesa"}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              {step < 3 && (
                <div className="mt-8 pt-4 border-t flex justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmUpgradeTitle') || "Confirmar Upgrade"}</DialogTitle>
            <DialogDescription>
              {t('confirmUpgradeDesc') || "¿Estás seguro de que el beneficiario completó el upgrade a MonCash Plus?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>
              {t('cancel') || "Cancelar"}
            </Button>
            <Button onClick={handleStartUpgrade}>
              {t('confirm') || "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

