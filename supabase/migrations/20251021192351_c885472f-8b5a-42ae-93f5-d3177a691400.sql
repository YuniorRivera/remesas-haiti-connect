-- Create helper to check if user has no roles
create or replace function public.user_has_no_roles(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select not exists (
    select 1 from public.user_roles where user_id = _user_id
  );
$$;

-- Create secure function to assign first sender_user role
create or replace function public.assign_sender_user()
returns json
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  _uid uuid := auth.uid();
  _inserted boolean := false;
begin
  if _uid is null then
    return json_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if public.user_has_no_roles(_uid) then
    insert into public.user_roles(user_id, role)
    values (_uid, 'sender_user'::app_role);
    _inserted := true;
  end if;

  return json_build_object('ok', true, 'created', _inserted);
end;
$$;

-- Allow only authenticated users to execute
grant execute on function public.assign_sender_user() to authenticated;

-- Replace INSERT policy to use the helper function
drop policy if exists "Usuarios pueden crear su primer rol o admins pueden crear cualq" on public.user_roles;

create policy "Primer rol via check o admin"
on public.user_roles
for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'admin'::app_role)
  or (
    user_id = auth.uid()
    and role = 'sender_user'::app_role
    and public.user_has_no_roles(auth.uid())
  )
);
