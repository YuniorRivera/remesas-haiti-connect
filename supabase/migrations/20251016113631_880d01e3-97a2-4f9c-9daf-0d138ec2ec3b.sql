-- =====================================================
-- MIGRACIÓN: Modelo de datos completo para sistema de remesas
-- =====================================================

-- 1. CREAR NUEVOS ENUMS
CREATE TYPE public.channel_type AS ENUM ('MONCASH', 'SPIH');
CREATE TYPE public.remittance_state AS ENUM ('CREATED', 'QUOTED', 'CONFIRMED', 'SENT', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE public.doc_type AS ENUM ('CEDULA', 'PASSPORT', 'RNC', 'CONTRACT', 'SELFIE', 'BUSINESS_LICENSE', 'BANK_STATEMENT');
CREATE TYPE public.actor_type AS ENUM ('USER', 'SYSTEM', 'ADMIN', 'AGENT');
CREATE TYPE public.reconciliation_source AS ENUM ('BANK', 'PAYOUT');

-- 2. ACTUALIZAR TABLA PROFILES (extender con campos de users)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.tiendas(id);

-- 3. RENOMBRAR Y EXPANDIR TIENDAS -> AGENTS
ALTER TABLE public.tiendas RENAME TO agents;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS gps_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS gps_lon NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS float_balance_dop NUMERIC(15, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS daily_limit_dop NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Renombrar columnas existentes para mantener consistencia
ALTER TABLE public.agents RENAME COLUMN nombre TO trade_name_old;
ALTER TABLE public.agents RENAME COLUMN direccion TO address_old;
ALTER TABLE public.agents RENAME COLUMN tipo_negocio TO business_type;
ALTER TABLE public.agents RENAME COLUMN ubicacion_gps TO gps_coords_legacy;
ALTER TABLE public.agents RENAME COLUMN dueno_id TO owner_user_id;
ALTER TABLE public.agents RENAME COLUMN activa TO is_active_old;
ALTER TABLE public.agents RENAME COLUMN float_disponible TO float_balance_dop_old;

-- Migrar datos de columnas antiguas a nuevas donde sea aplicable
UPDATE public.agents 
SET 
  trade_name = COALESCE(trade_name, trade_name_old),
  is_active = COALESCE(is_active, is_active_old, true),
  float_balance_dop = COALESCE(float_balance_dop, float_balance_dop_old, 0.00);

-- 4. CREAR TABLA KYC_DOCUMENTS
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doc_type doc_type NOT NULL,
  doc_number TEXT,
  status verification_status DEFAULT 'pending',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kyc_documents
CREATE POLICY "Usuarios ven sus propios documentos KYC"
  ON public.kyc_documents FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_officer'));

CREATE POLICY "Usuarios pueden subir sus documentos KYC"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Compliance puede actualizar KYC"
  ON public.kyc_documents FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_officer'));

-- 5. CREAR TABLA KYB_DOCUMENTS
CREATE TABLE IF NOT EXISTS public.kyb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  doc_type doc_type NOT NULL,
  status verification_status DEFAULT 'pending',
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.kyb_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kyb_documents
CREATE POLICY "Agentes ven documentos de su tienda"
  ON public.kyb_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND owner_user_id = auth.uid())
    OR has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'compliance_officer')
  );

CREATE POLICY "Compliance puede gestionar KYB"
  ON public.kyb_documents FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_officer'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'compliance_officer'));

-- 6. CREAR TABLA FEES_MATRIX
CREATE TABLE IF NOT EXISTS public.fees_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor TEXT DEFAULT 'RD->HT',
  channel channel_type NOT NULL,
  fixed_fee_dop NUMERIC(10, 2) NOT NULL,
  percent_fee_client NUMERIC(5, 4) NOT NULL,
  spread_bps INTEGER NOT NULL,
  acquiring_dop NUMERIC(10, 2) NOT NULL,
  gov_fee_usd NUMERIC(10, 2) DEFAULT 1.50,
  partner_fee_flat_htg NUMERIC(10, 2) NOT NULL,
  partner_fee_percent NUMERIC(5, 4) NOT NULL,
  min_partner_fee_htg NUMERIC(10, 2) NOT NULL,
  store_commission_pct NUMERIC(5, 4) NOT NULL,
  platform_commission_pct NUMERIC(5, 4) NOT NULL,
  fx_dop_htg_mid NUMERIC(10, 6) NOT NULL,
  fx_usd_dop NUMERIC(10, 4) NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.fees_matrix ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fees_matrix
CREATE POLICY "Todos pueden ver fees activas"
  ON public.fees_matrix FOR SELECT
  USING (is_active = true);

CREATE POLICY "Solo admins pueden gestionar fees"
  ON public.fees_matrix FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. CREAR TABLAS LEDGER (DOBLE ENTRADA)
CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  agent_id UUID REFERENCES public.agents(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven todas las cuentas ledger"
  ON public.ledger_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_id UUID,
  entry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  debit_account UUID REFERENCES public.ledger_accounts(id) NOT NULL,
  credit_account UUID REFERENCES public.ledger_accounts(id) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL,
  memo TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven todas las entradas ledger"
  ON public.ledger_entries FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 8. RENOMBRAR Y EXPANDIR TRANSACCIONES -> REMITTANCES
ALTER TABLE public.transacciones RENAME TO remittances;

ALTER TABLE public.remittances
  ADD COLUMN IF NOT EXISTS state remittance_state DEFAULT 'CREATED',
  ADD COLUMN IF NOT EXISTS channel channel_type,
  ADD COLUMN IF NOT EXISTS fx_mid_dop_htg NUMERIC(10, 6),
  ADD COLUMN IF NOT EXISTS fx_client_sell NUMERIC(10, 6),
  ADD COLUMN IF NOT EXISTS htg_before_partner NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS partner_fee_htg NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS htg_to_beneficiary NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS client_fee_fixed_dop NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS client_fee_pct_dop NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS acquiring_cost_dop NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS gov_fee_dop NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS total_client_fees_dop NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS total_client_pays_dop NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS platform_commission_dop NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS fx_spread_rev_dop NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS partner_cost_dop_equiv NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS platform_gross_margin_dop NUMERIC(15, 2),
  ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS origin_terminal_id TEXT,
  ADD COLUMN IF NOT EXISTS origin_cashier_user UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS origin_ip TEXT,
  ADD COLUMN IF NOT EXISTS origin_device_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS payout_network TEXT,
  ADD COLUMN IF NOT EXISTS payout_country TEXT DEFAULT 'HT',
  ADD COLUMN IF NOT EXISTS payout_city TEXT,
  ADD COLUMN IF NOT EXISTS payout_agent_code TEXT,
  ADD COLUMN IF NOT EXISTS payout_agent_name TEXT,
  ADD COLUMN IF NOT EXISTS payout_address TEXT,
  ADD COLUMN IF NOT EXISTS payout_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS payout_lon NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS payout_operator_id TEXT,
  ADD COLUMN IF NOT EXISTS payout_receipt_num TEXT,
  ADD COLUMN IF NOT EXISTS receipt_hash TEXT;

-- Renombrar columnas existentes
ALTER TABLE public.remittances RENAME COLUMN tienda_id TO agent_id_legacy;
ALTER TABLE public.remittances RENAME COLUMN notas TO memo;

-- Agregar nueva columna agent_id con referencia correcta
ALTER TABLE public.remittances ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id);

-- Migrar datos de la columna legacy
UPDATE public.remittances SET agent_id = agent_id_legacy WHERE agent_id IS NULL;

-- 9. CREAR TABLA REMITTANCE_EVENTS
CREATE TABLE IF NOT EXISTS public.remittance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remittance_id UUID REFERENCES public.remittances(id) ON DELETE CASCADE NOT NULL,
  event TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_type actor_type NOT NULL,
  actor_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.remittance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver eventos según acceso a remesa"
  ON public.remittance_events FOR SELECT
  USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.remittances 
      WHERE id = remittance_id 
      AND (agente_id = auth.uid() OR emisor_id = auth.uid())
    )
  );

-- 10. CREAR TABLA RECONCILIATIONS
CREATE TABLE IF NOT EXISTS public.reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source reconciliation_source NOT NULL,
  file_ref TEXT,
  data_json JSONB,
  status TEXT DEFAULT 'pending',
  variance_dop NUMERIC(15, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins ven reconciliaciones"
  ON public.reconciliations FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 11. CREAR TABLA AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins ven audit log"
  ON public.audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 12. CREAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyb_documents_agent_id ON public.kyb_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_fees_matrix_channel_active ON public.fees_matrix(channel, is_active);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_txn_id ON public.ledger_entries(txn_id);
CREATE INDEX IF NOT EXISTS idx_remittances_state ON public.remittances(state);
CREATE INDEX IF NOT EXISTS idx_remittances_agent_id ON public.remittances(agent_id);
CREATE INDEX IF NOT EXISTS idx_remittances_created_at ON public.remittances(created_at);
CREATE INDEX IF NOT EXISTS idx_remittance_events_remittance_id ON public.remittance_events(remittance_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity, entity_id);

-- 13. TRIGGERS PARA UPDATED_AT
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 14. INSERTAR DATOS INICIALES DE FEES_MATRIX (EJEMPLO)
INSERT INTO public.fees_matrix (
  corridor, channel, fixed_fee_dop, percent_fee_client, spread_bps, 
  acquiring_dop, gov_fee_usd, partner_fee_flat_htg, partner_fee_percent, 
  min_partner_fee_htg, store_commission_pct, platform_commission_pct, 
  fx_dop_htg_mid, fx_usd_dop, notes
) VALUES 
(
  'RD->HT', 'MONCASH', 100.00, 0.0200, 50, 
  50.00, 1.50, 50.00, 0.0100, 
  25.00, 0.0050, 0.0100, 
  1.35, 58.50, 'Configuración inicial MonCash'
),
(
  'RD->HT', 'SPIH', 100.00, 0.0200, 50, 
  50.00, 1.50, 75.00, 0.0150, 
  35.00, 0.0050, 0.0100, 
  1.35, 58.50, 'Configuración inicial SPIH'
)
ON CONFLICT DO NOTHING;