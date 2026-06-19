-- =============================================================================
-- Permite que el trigger de role-escalation deje pasar updates cuando la query
-- corre como rol de DB privilegiado (postgres en Studio, supabase_admin internas,
-- service_role desde un backend). Los usuarios autenticados normales siguen
-- pasando por public.is_admin().
-- =============================================================================

create or replace function public.profiles_prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Bypass para roles privilegiados de DB (Studio SQL Editor + backend con
  -- service_role). auth.uid() es null en estos contextos, por eso is_admin()
  -- no aplica.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change role';
  end if;

  return new;
end;
$$;
