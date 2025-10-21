-- Ensure helper function exists (idempotent)
CREATE OR REPLACE FUNCTION public.user_has_no_roles(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  );
$$;

-- Ensure RPC to assign first role exists (idempotent)
CREATE OR REPLACE FUNCTION public.assign_sender_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _inserted boolean := false;
BEGIN
  IF _uid IS NULL THEN
    RETURN json_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  IF public.user_has_no_roles(_uid) THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (_uid, 'sender_user'::app_role);
    _inserted := true;
  END IF;

  RETURN json_build_object('ok', true, 'created', _inserted);
END;
$$;

-- Grant execute to authenticated users (safe if already granted)
GRANT EXECUTE ON FUNCTION public.assign_sender_user() TO authenticated;

-- Replace INSERT policy to use the helper function (drop both possible names first)
DROP POLICY IF EXISTS "Primer rol via check o admin" ON public.user_roles;
DROP POLICY IF EXISTS "Usuarios pueden crear su primer rol o admins pueden crear cualquier rol" ON public.user_roles;

CREATE POLICY "Primer rol via check o admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    user_id = auth.uid()
    AND role = 'sender_user'::app_role
    AND public.user_has_no_roles(auth.uid())
  )
);
