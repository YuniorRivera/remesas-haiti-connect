-- Fix security warnings by updating function search_path
-- Drop the view first
DROP VIEW IF EXISTS tiendas_agent_view;

-- Update has_role function with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update get_transaction_for_agent with proper search_path
CREATE OR REPLACE FUNCTION get_transaction_for_agent(transaction_id UUID)
RETURNS TABLE (
  id UUID,
  emisor_nombre TEXT,
  beneficiario_nombre TEXT,
  monto_enviado_dop NUMERIC,
  monto_recibido_htg NUMERIC,
  tasa_cambio NUMERIC,
  comision_agente NUMERIC,
  estado transaction_status,
  created_at TIMESTAMP WITH TIME ZONE,
  completada_at TIMESTAMP WITH TIME ZONE,
  codigo_referencia TEXT
) 
SECURITY DEFINER
SET search_path TO public, pg_temp
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    t.id,
    t.emisor_nombre,
    t.beneficiario_nombre,
    t.monto_enviado_dop,
    t.monto_recibido_htg,
    t.tasa_cambio,
    t.comision_agente,
    t.estado,
    t.created_at,
    t.completada_at,
    t.codigo_referencia
  FROM transacciones t
  WHERE t.id = transaction_id
    AND (
      t.agente_id = auth.uid()
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'compliance_officer')
    );
$$;