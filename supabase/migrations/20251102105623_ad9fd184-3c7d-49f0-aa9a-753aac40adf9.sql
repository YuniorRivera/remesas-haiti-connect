-- Create beneficiary_prism_status table for MonCash Plus upgrade tracking
CREATE TABLE IF NOT EXISTS public.beneficiary_prism_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_phone TEXT NOT NULL UNIQUE,
  beneficiary_name TEXT,
  upgrade_status TEXT NOT NULL DEFAULT 'pending' CHECK (upgrade_status IN ('pending', 'in_progress', 'completed', 'failed')),
  prism_opt_in BOOLEAN NOT NULL DEFAULT false,
  prism_authorized_at TIMESTAMPTZ,
  upgrade_completed_at TIMESTAMPTZ,
  upgrade_failed_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_beneficiary_prism_phone ON public.beneficiary_prism_status(beneficiary_phone);

-- Enable Row Level Security
ALTER TABLE public.beneficiary_prism_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to manage PRISM status
CREATE POLICY "Allow authenticated users to read PRISM status"
  ON public.beneficiary_prism_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert PRISM status"
  ON public.beneficiary_prism_status
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update PRISM status"
  ON public.beneficiary_prism_status
  FOR UPDATE
  TO authenticated
  USING (true);