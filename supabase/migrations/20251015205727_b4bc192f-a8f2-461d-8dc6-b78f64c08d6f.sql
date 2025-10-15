-- Enum para roles de la aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'agente', 'emisor');

-- Enum para estado de transacciones
CREATE TYPE public.transaction_status AS ENUM ('pendiente', 'completada', 'cancelada', 'en_proceso');

-- Tabla de roles de usuarios
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Tabla de perfiles de usuarios
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  documento_identidad TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabla de tiendas/colmados
CREATE TABLE public.tiendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  telefono TEXT,
  agente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  float_disponible DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (float_disponible >= 0),
  activa BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabla de transacciones de remesas
CREATE TABLE public.transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_referencia TEXT UNIQUE NOT NULL,
  
  -- Emisor (quien envía)
  emisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  emisor_nombre TEXT NOT NULL,
  emisor_telefono TEXT,
  emisor_documento TEXT,
  
  -- Beneficiario (quien recibe en Haití)
  beneficiario_nombre TEXT NOT NULL,
  beneficiario_telefono TEXT,
  beneficiario_documento TEXT,
  
  -- Montos
  monto_enviado_dop DECIMAL(12,2) NOT NULL CHECK (monto_enviado_dop > 0),
  tasa_cambio DECIMAL(10,4) NOT NULL,
  monto_recibido_htg DECIMAL(12,2) NOT NULL CHECK (monto_recibido_htg > 0),
  comision DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  
  -- Agente y tienda
  tienda_id UUID REFERENCES public.tiendas(id) ON DELETE SET NULL,
  agente_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Estado y fechas
  estado transaction_status DEFAULT 'pendiente' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completada_at TIMESTAMP WITH TIME ZONE,
  
  -- Notas internas
  notas TEXT
);

-- Índices para búsquedas comunes
CREATE INDEX idx_transacciones_emisor ON public.transacciones(emisor_id);
CREATE INDEX idx_transacciones_agente ON public.transacciones(agente_id);
CREATE INDEX idx_transacciones_tienda ON public.transacciones(tienda_id);
CREATE INDEX idx_transacciones_estado ON public.transacciones(estado);
CREATE INDEX idx_transacciones_fecha ON public.transacciones(created_at DESC);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

-- Función security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- RLS: user_roles - solo admins pueden modificar, usuarios pueden ver sus propios roles
CREATE POLICY "Usuarios pueden ver sus propios roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden insertar roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: profiles - usuarios ven su perfil, admins ven todos
CREATE POLICY "Usuarios pueden ver su perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS: tiendas - agentes ven su tienda, admins ven todas
CREATE POLICY "Agentes ven su tienda asignada"
  ON public.tiendas FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    agente_id = auth.uid()
  );

CREATE POLICY "Solo admins pueden crear tiendas"
  ON public.tiendas FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar tiendas"
  ON public.tiendas FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar tiendas"
  ON public.tiendas FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: transacciones - emisores ven las suyas, agentes ven las de su tienda, admins ven todas
CREATE POLICY "Ver transacciones según rol"
  ON public.transacciones FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    agente_id = auth.uid() OR
    emisor_id = auth.uid()
  );

CREATE POLICY "Agentes y admins pueden crear transacciones"
  ON public.transacciones FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'agente')
  );

CREATE POLICY "Agentes y admins pueden actualizar transacciones"
  ON public.transacciones FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    (public.has_role(auth.uid(), 'agente') AND agente_id = auth.uid())
  );

-- Trigger para actualizar updated_at en profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tiendas_updated_at
  BEFORE UPDATE ON public.tiendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();