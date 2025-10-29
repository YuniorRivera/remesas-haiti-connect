import { useState, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { remittanceSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { secureSupabase } from "@/lib/secureSupabase";
import { logger } from "@/lib/logger";
import type {
  PricingQuote,
  CreateRemittanceResponse,
  FraudDetectionResponse,
  Remittance,
  ConfirmRemittanceResponse,
  SupabaseFunctionError,
} from "@/types/api";

export type RemittanceFormData = {
  emisor_nombre: string;
  emisor_telefono: string;
  emisor_documento: string;
  beneficiario_nombre: string;
  beneficiario_telefono: string;
  beneficiario_documento: string;
  payout_city: string;
  principal_dop: string;
  channel: "MONCASH" | "SPIH";
};

export type RemittanceFormState = {
  formData: RemittanceFormData;
  quote: PricingQuote | null;
  errors: Record<string, string>;
  feesAvailable: boolean;
  confirmedRemittance: Remittance | null;
  loading: boolean;
};

export function useRemittanceForm(initialData?: Partial<RemittanceFormData>) {
  const [formData, setFormData] = useState<RemittanceFormData>({
    emisor_nombre: "",
    emisor_telefono: "",
    emisor_documento: "",
    beneficiario_nombre: "",
    beneficiario_telefono: "",
    beneficiario_documento: "",
    payout_city: "",
    principal_dop: "",
    channel: "MONCASH",
    ...initialData,
  });

  const [quote, setQuote] = useState<PricingQuote | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feesAvailable, setFeesAvailable] = useState(true);
  const [confirmedRemittance, setConfirmedRemittance] = useState<Remittance | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = useCallback((field: keyof RemittanceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const checkFeesAvailability = useCallback(async (channel: "MONCASH" | "SPIH") => {
    const { data, error } = await supabase
      .from("fees_matrix")
      .select("id")
      .eq("corridor", "RD->HT")
      .eq("channel", channel)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      logger.warn("Error checking fees:", error);
      return false;
    }

    const available = !!data;
    setFeesAvailable(available);
    return available;
  }, []);

  const getQuote = useCallback(async () => {
    if (!formData.principal_dop || parseFloat(formData.principal_dop) <= 0) {
      toast.error("Ingrese un monto válido");
      return null;
    }

    const available = await checkFeesAvailability(formData.channel);
    if (!available) {
      toast.error("No hay tarifas configuradas para este canal. Contacte al administrador.");
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await secureSupabase.functions.invoke("pricing-quote", {
        body: {
          principal_dop: parseFloat(formData.principal_dop),
          channel: formData.channel,
        },
      });

      if (error) throw error;

      const pricingQuote = data as PricingQuote;
      setQuote(pricingQuote);
      toast.success("Cotización generada");
      return pricingQuote;
    } catch (error) {
      const err = error as SupabaseFunctionError;
      toast.error(err.message || "Error al generar cotización");
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData.principal_dop, formData.channel, checkFeesAvailability]);

  const validateForm = useCallback((): boolean => {
    setErrors({});
    try {
      remittanceSchema.parse({
        emisor_nombre: formData.emisor_nombre,
        emisor_telefono: formData.emisor_telefono || "",
        emisor_documento: formData.emisor_documento || "",
        beneficiario_nombre: formData.beneficiario_nombre,
        beneficiario_telefono: formData.beneficiario_telefono,
        beneficiario_documento: formData.beneficiario_documento || "",
        principal_dop: parseFloat(formData.principal_dop),
        channel: formData.channel,
        payout_city: formData.payout_city || "",
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Corrige los errores en el formulario");
      }
      return false;
    }
  }, [formData]);

  const checkFraud = useCallback(async (): Promise<boolean> => {
    try {
      const { data: fraudCheck, error: fraudError } = await secureSupabase.functions.invoke("fraud-detection", {
        body: {
          emisor_documento: formData.emisor_documento || "",
          beneficiario_telefono: formData.beneficiario_telefono,
          principal_dop: parseFloat(formData.principal_dop),
          origin_ip: typeof window !== "undefined" ? window.location.hostname : "unknown",
        },
      });

      if (fraudError) {
        logger.warn("Fraud check failed:", fraudError);
        return true; // Allow to proceed if fraud check fails
      }

      const fraud = fraudCheck as FraudDetectionResponse | null;
      if (fraud?.should_block) {
        toast.error(`Transacción bloqueada: ${fraud.flags.join(", ")}`);
        return false;
      } else if (fraud?.risk_level === "medium") {
        toast.warning(`Advertencia: ${fraud.flags.join(", ")}`);
      }
      return true;
    } catch (error) {
      logger.error("Error in fraud check:", error);
      return true; // Allow to proceed on error
    }
  }, [formData]);

  const createRemittance = useCallback(async (): Promise<Remittance | null> => {
    if (!validateForm()) {
      return null;
    }

    const canProceed = await checkFraud();
    if (!canProceed) {
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await secureSupabase.functions.invoke("remittances-create", {
        body: {
          emisor_nombre: formData.emisor_nombre.trim(),
          emisor_telefono: formData.emisor_telefono.trim() || null,
          emisor_documento: formData.emisor_documento.trim() || null,
          beneficiario_nombre: formData.beneficiario_nombre.trim(),
          beneficiario_telefono: formData.beneficiario_telefono.trim(),
          beneficiario_documento: formData.beneficiario_documento.trim() || null,
          principal_dop: parseFloat(formData.principal_dop),
          channel: formData.channel,
          payout_city: formData.payout_city.trim() || null,
          origin_ip: typeof window !== "undefined" ? window.location.hostname : "unknown",
        },
      });

      if (error) throw error;

      const result = data as CreateRemittanceResponse;
      if (result?.success) {
        toast.success("Remesa creada exitosamente");
        return result.remittance;
      }
      return null;
    } catch (error) {
      const err = error as SupabaseFunctionError;
      toast.error(err.message || "Error al crear remesa");
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, checkFraud]);

  const confirmRemittance = useCallback(async (): Promise<Remittance | null> => {
    if (!quote?.remittance?.id) {
      toast.error("No hay cotización para confirmar");
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await secureSupabase.functions.invoke("remittances-confirm", {
        body: {
          remittance_id: quote.remittance.id,
        },
      });

      if (error) throw error;

      const result = data as ConfirmRemittanceResponse;
      if (result?.success && quote?.remittance) {
        const confirmed: Remittance = {
          ...quote.remittance,
          ...result.remittance,
          emisor_nombre: formData.emisor_nombre,
          beneficiario_nombre: formData.beneficiario_nombre,
          beneficiario_telefono: formData.beneficiario_telefono,
          channel: formData.channel,
        };
        setConfirmedRemittance(confirmed);
        toast.success("Remesa confirmada exitosamente");
        return confirmed;
      }
      return null;
    } catch (error) {
      const err = error as SupabaseFunctionError;
      toast.error(err.message || "Error al confirmar remesa");
      return null;
    } finally {
      setLoading(false);
    }
  }, [quote, formData]);

  return {
    formData,
    updateField,
    quote,
    errors,
    feesAvailable,
    confirmedRemittance,
    loading,
    getQuote,
    createRemittance,
    confirmRemittance,
    checkFeesAvailability,
  };
}

