-- =====================================================
-- MIGRACIÓN: Add MonCash Plus upgrade + PRISM opt-in tracking
-- =====================================================

-- 1. Create beneficiary PRISM status table
CREATE TABLE IF NOT EXISTS public.beneficiary_prism_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_phone TEXT NOT NULL UNIQUE,
  beneficiary_name TEXT NOT NULL,
  upgrade_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  prism_opt_in BOOLEAN DEFAULT FALSE NOT NULL,
  prism_authorized_at TIMESTAMPTZ,
  upgrade_completed_at TIMESTAMPTZ,
  upgrade_failed_reason TEXT,
  last_checked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Indexes for fast lookups
  CONSTRAINT valid_upgrade_status CHECK (upgrade_status IN ('pending', 'in_progress', 'completed', 'failed'))
);

CREATE INDEX idx_prism_beneficiary_phone ON public.beneficiary_prism_status(beneficiary_phone);
CREATE INDEX idx_prism_upgrade_status ON public.beneficiary_prism_status(upgrade_status);
CREATE INDEX idx_prism_opt_in ON public.beneficiary_prism_status(prism_opt_in);

-- 2. Add PRISM opt-in status to remittances
ALTER TABLE public.remittances
  ADD COLUMN IF NOT EXISTS beneficiary_prism_required BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS beneficiary_prism_status TEXT,
  ADD COLUMN IF NOT EXISTS prism_warning_shown BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN public.remittances.beneficiary_prism_required IS 'Whether this remittance requires PRISM opt-in';
COMMENT ON COLUMN public.remittances.beneficiary_prism_status IS 'Current PRISM status: pending, in_progress, opt_in, not_opt_in';
COMMENT ON COLUMN public.remittances.prism_warning_shown IS 'Whether warning was already shown to user';

-- 3. Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_prism_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_prism_updated_at
  BEFORE UPDATE ON public.beneficiary_prism_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_prism_updated_at();

-- 4. Add RLS policies
ALTER TABLE public.beneficiary_prism_status ENABLE ROW LEVEL SECURITY;

-- Only admins and compliance can view
CREATE POLICY "Only admins and compliance can view PRISM status"
  ON public.beneficiary_prism_status FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'compliance_officer')
  );

-- Only system or admins can modify
CREATE POLICY "Only admins can modify PRISM status"
  ON public.beneficiary_prism_status FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.beneficiary_prism_status IS 'Tracks MonCash Plus upgrade and PRISM opt-in status for beneficiaries';

