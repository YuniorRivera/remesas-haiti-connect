-- Create limits table for transaction limits
CREATE TABLE IF NOT EXISTS public.limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'agent', 'global')),
  entity_id UUID,
  limit_type TEXT NOT NULL CHECK (limit_type IN ('daily_amount', 'monthly_amount', 'transaction_count_daily', 'transaction_count_monthly', 'single_transaction')),
  amount_dop NUMERIC,
  count_limit INTEGER,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for limits
CREATE POLICY "Admins pueden ver todos los límites"
ON public.limits
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins pueden crear límites"
ON public.limits
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins pueden actualizar límites"
ON public.limits
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins pueden eliminar límites"
ON public.limits
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_limits_entity ON public.limits(entity_type, entity_id);
CREATE INDEX idx_limits_active ON public.limits(is_active, effective_from, effective_until);

-- Create risk_flags table for fraud detection
CREATE TABLE IF NOT EXISTS public.risk_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'agent', 'remittance')),
  entity_id UUID NOT NULL,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  auto_generated BOOLEAN DEFAULT true,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_flags
CREATE POLICY "Admins y compliance pueden ver risk flags"
ON public.risk_flags
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'compliance_officer')
);

CREATE POLICY "Sistema puede crear risk flags"
ON public.risk_flags
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'compliance_officer')
);

CREATE POLICY "Admins y compliance pueden actualizar risk flags"
ON public.risk_flags
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'compliance_officer')
);

CREATE POLICY "Solo admins pueden eliminar risk flags"
ON public.risk_flags
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_risk_flags_entity ON public.risk_flags(entity_type, entity_id);
CREATE INDEX idx_risk_flags_severity ON public.risk_flags(severity, resolved);
CREATE INDEX idx_risk_flags_created ON public.risk_flags(created_at DESC);

-- Add trigger for updated_at on limits
CREATE TRIGGER update_limits_updated_at
BEFORE UPDATE ON public.limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();