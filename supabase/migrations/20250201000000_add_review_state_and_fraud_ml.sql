-- =====================================================
-- MIGRACIÓN: Add REVIEW state for fraud detection + ML hook
-- =====================================================

-- 1. Add 'REVIEW' state to remittance_state enum
ALTER TYPE public.remittance_state ADD VALUE IF NOT EXISTS 'REVIEW';

-- 2. Create greylist table for manual review
CREATE TABLE IF NOT EXISTS public.greylist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'documento', 'telefono', 'ip', 'email'
  entity_value TEXT NOT NULL,
  risk_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(entity_type, entity_value)
);

-- 3. Create index for fast greylist lookups
CREATE INDEX IF NOT EXISTS idx_greylist_entity ON public.greylist(entity_type, entity_value);

-- 4. Add RLS policies for greylist
ALTER TABLE public.greylist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins and compliance can view greylist"
  ON public.greylist FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance_officer'));

CREATE POLICY "Only admins can modify greylist"
  ON public.greylist FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_greylist_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_greylist_updated_at
  BEFORE UPDATE ON public.greylist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_greylist_updated_at();

-- 6. Add fraud_score column to remittances (for ML score storage)
ALTER TABLE public.remittances
  ADD COLUMN IF NOT EXISTS fraud_score NUMERIC(5, 2), -- 0.00 - 100.00
  ADD COLUMN IF NOT EXISTS fraud_flags JSONB,
  ADD COLUMN IF NOT EXISTS ml_score NUMERIC(5, 2); -- ML model score placeholder

-- 7. Create index for fraud score queries
CREATE INDEX IF NOT EXISTS idx_remittances_fraud_score ON public.remittances(fraud_score)
  WHERE fraud_score IS NOT NULL;

COMMENT ON TABLE public.greylist IS 'Manual review greylist for suspicious entities';
COMMENT ON COLUMN public.remittances.fraud_score IS 'Aggregated fraud risk score (0-100)';
COMMENT ON COLUMN public.remittances.ml_score IS 'Machine learning model fraud score';
COMMENT ON COLUMN public.remittances.fraud_flags IS 'Detailed fraud flags for review';

