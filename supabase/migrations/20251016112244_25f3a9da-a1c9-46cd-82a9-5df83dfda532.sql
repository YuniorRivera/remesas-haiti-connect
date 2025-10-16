-- Drop all dependent policies and function first
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios roles" ON user_roles;
DROP POLICY IF EXISTS "Solo admins pueden insertar roles" ON user_roles;
DROP POLICY IF EXISTS "Solo admins pueden actualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Solo admins pueden eliminar roles" ON user_roles;
DROP POLICY IF EXISTS "Usuarios pueden ver su perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden insertar su perfil" ON profiles;
DROP POLICY IF EXISTS "Agentes ven su tienda asignada" ON tiendas;
DROP POLICY IF EXISTS "Solo admins pueden crear tiendas" ON tiendas;
DROP POLICY IF EXISTS "Solo admins pueden actualizar tiendas" ON tiendas;
DROP POLICY IF EXISTS "Solo admins pueden eliminar tiendas" ON tiendas;
DROP POLICY IF EXISTS "Ver transacciones según rol" ON transacciones;
DROP POLICY IF EXISTS "Agentes y admins pueden crear transacciones" ON transacciones;
DROP POLICY IF EXISTS "Agentes y admins pueden actualizar transacciones" ON transacciones;
DROP FUNCTION IF EXISTS has_role(uuid, app_role);

-- Update app_role enum with new roles
ALTER TYPE app_role RENAME TO app_role_old;

CREATE TYPE app_role AS ENUM (
  'admin',
  'agent_owner',
  'agent_clerk', 
  'compliance_officer',
  'sender_user'
);

-- Migrate existing roles to new enum
ALTER TABLE user_roles 
  ALTER COLUMN role TYPE app_role 
  USING (
    CASE role::text
      WHEN 'admin' THEN 'admin'::app_role
      WHEN 'agente' THEN 'agent_owner'::app_role
      WHEN 'emisor' THEN 'sender_user'::app_role
    END
  );

DROP TYPE app_role_old;

-- Recreate has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create KYC level enum
CREATE TYPE kyc_level AS ENUM ('L1', 'L2', 'L3');

-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected', 'review');

-- Update profiles table for KYC (persona física)
ALTER TABLE profiles
  ADD COLUMN tipo_documento TEXT CHECK (tipo_documento IN ('cedula', 'pasaporte', 'otro')),
  ADD COLUMN selfie_url TEXT,
  ADD COLUMN direccion TEXT,
  ADD COLUMN kyc_level kyc_level DEFAULT 'L1',
  ADD COLUMN kyc_status verification_status DEFAULT 'pending',
  ADD COLUMN kyc_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN kyc_verified_by UUID REFERENCES auth.users(id);

-- Update tiendas table for KYB (establecimiento)
ALTER TABLE tiendas
  ADD COLUMN rnc TEXT UNIQUE,
  ADD COLUMN razon_social TEXT,
  ADD COLUMN nombre_comercial TEXT,
  ADD COLUMN tipo_negocio TEXT,
  ADD COLUMN ubicacion_gps TEXT,
  ADD COLUMN dueno_id UUID REFERENCES auth.users(id),
  ADD COLUMN cuenta_bancaria_encriptada TEXT,
  ADD COLUMN contrato_url TEXT,
  ADD COLUMN kyb_status verification_status DEFAULT 'pending',
  ADD COLUMN kyb_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN kyb_verified_by UUID REFERENCES auth.users(id);

-- Update transacciones table to separate agent commission from platform margin
ALTER TABLE transacciones
  RENAME COLUMN comision TO comision_agente;

ALTER TABLE transacciones
  ADD COLUMN margen_plataforma NUMERIC(10,2) DEFAULT 0.00 NOT NULL;

-- Recreate RLS policies with new roles

-- user_roles policies
CREATE POLICY "Usuarios pueden ver sus propios roles" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden insertar roles" ON user_roles
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar roles" ON user_roles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar roles" ON user_roles
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- profiles policies
CREATE POLICY "Usuarios pueden ver su perfil" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'compliance_officer')
  );

CREATE POLICY "Usuarios pueden actualizar su perfil" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su perfil" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Compliance puede actualizar KYC" ON profiles
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'compliance_officer')
  );

-- tiendas policies
CREATE POLICY "Agentes ven su tienda asignada" ON tiendas
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'compliance_officer')
    OR agente_id = auth.uid()
    OR dueno_id = auth.uid()
  );

CREATE POLICY "Solo admins pueden crear tiendas" ON tiendas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar tiendas" ON tiendas
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar tiendas" ON tiendas
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create a view for agent-safe data (without sensitive KYB/platform margins)
CREATE OR REPLACE VIEW tiendas_agent_view AS
SELECT 
  id,
  nombre,
  direccion,
  telefono,
  float_disponible,
  activa,
  agente_id,
  created_at,
  updated_at
FROM tiendas;

-- transacciones policies
CREATE POLICY "Ver transacciones según rol" ON transacciones
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'compliance_officer')
    OR agente_id = auth.uid()
    OR emisor_id = auth.uid()
  );

CREATE POLICY "Agentes y admins pueden crear transacciones" ON transacciones
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'agent_owner')
    OR has_role(auth.uid(), 'agent_clerk')
  );

CREATE POLICY "Agentes y admins pueden actualizar transacciones" ON transacciones
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') 
    OR (
      (has_role(auth.uid(), 'agent_owner') OR has_role(auth.uid(), 'agent_clerk'))
      AND agente_id = auth.uid()
    )
  );

-- Create function to hide platform margin from agents
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
SET search_path = public
LANGUAGE SQL
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

-- Add indexes for performance on new fields
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_tiendas_kyb_status ON tiendas(kyb_status);
CREATE INDEX IF NOT EXISTS idx_tiendas_dueno ON tiendas(dueno_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);