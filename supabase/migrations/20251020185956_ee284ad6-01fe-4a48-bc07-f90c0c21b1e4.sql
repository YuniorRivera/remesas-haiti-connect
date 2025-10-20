-- Eliminar la política restrictiva actual que bloquea el registro de usuarios
DROP POLICY IF EXISTS "Solo admins pueden insertar roles" ON user_roles;

-- Crear una nueva política que permite autoregistro seguro
CREATE POLICY "Usuarios pueden crear su primer rol o admins pueden crear cualquier rol"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admins pueden insertar cualquier rol
  has_role(auth.uid(), 'admin'::app_role)
  OR 
  -- Usuarios pueden insertar su primer rol sender_user si no tienen roles
  (
    user_id = auth.uid() 
    AND role = 'sender_user'::app_role
    AND NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid()
    )
  )
);