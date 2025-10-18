-- Permitir a usuarios autenticados crear su solicitud de agente
CREATE POLICY "Usuarios pueden crear su solicitud de agente"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid() AND kyb_status = 'pending');

-- Modificar política SELECT para que usuarios vean su propia solicitud
DROP POLICY IF EXISTS "Agentes ven su tienda asignada" ON public.agents;

CREATE POLICY "Ver tiendas según rol"
ON public.agents
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'compliance_officer'::app_role) 
  OR agente_id = auth.uid()
  OR owner_user_id = auth.uid()
);