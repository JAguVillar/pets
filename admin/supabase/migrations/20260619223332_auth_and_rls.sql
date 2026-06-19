-- =============================================================================
-- Auth + roles + RLS policies
-- - Tabla profiles + trigger on auth.users signup
-- - Helper is_admin()
-- - Policies para catálogos, organizations, lost_pets, animals_for_adoption,
--   profiles
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: extiende auth.users con datos del dominio + role
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-crea fila en profiles cuando aparece un usuario nuevo en auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: por si ya hay usuarios en auth.users (signup previo en smoke test)
insert into public.profiles (id, full_name)
select id, raw_user_meta_data->>'full_name'
from auth.users
on conflict (id) do nothing;

-- Previene que un user no-admin se autoasigne role=admin actualizando su profile
create or replace function public.profiles_prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change role';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- is_admin(): chequea si el caller actual tiene role=admin
-- security definer + search_path='' evita recursión infinita con la policy de
-- profiles y previene search path attacks.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Trigger que usa is_admin(), declarado después de la función
create trigger profiles_check_role_change
  before update on public.profiles
  for each row execute function public.profiles_prevent_role_escalation();

-- =============================================================================
-- Policies: catálogos públicos
-- Lectura para todos (anon + authenticated), escritura solo admin.
-- =============================================================================

-- species
create policy "species: public read"
  on public.species for select
  using (true);
create policy "species: admin write"
  on public.species for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- breeds
create policy "breeds: public read"
  on public.breeds for select
  using (true);
create policy "breeds: admin write"
  on public.breeds for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- colors
create policy "colors: public read"
  on public.colors for select
  using (true);
create policy "colors: admin write"
  on public.colors for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- coat_types
create policy "coat_types: public read"
  on public.coat_types for select
  using (true);
create policy "coat_types: admin write"
  on public.coat_types for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- sexes
create policy "sexes: public read"
  on public.sexes for select
  using (true);
create policy "sexes: admin write"
  on public.sexes for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- sizes
create policy "sizes: public read"
  on public.sizes for select
  using (true);
create policy "sizes: admin write"
  on public.sizes for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- pet_status
create policy "pet_status: public read"
  on public.pet_status for select
  using (true);
create policy "pet_status: admin write"
  on public.pet_status for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- adoption_status
create policy "adoption_status: public read"
  on public.adoption_status for select
  using (true);
create policy "adoption_status: admin write"
  on public.adoption_status for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- Policies: organizations
-- Lectura pública, escritura solo admin (los refugios los gestiona el admin)
-- =============================================================================
create policy "organizations: public read"
  on public.organizations for select
  using (true);
create policy "organizations: admin write"
  on public.organizations for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- Policies: lost_pets
-- - SELECT: cualquiera puede ver
-- - INSERT: authenticated, debe ser dueño (owner_user_id = auth.uid())
-- - UPDATE/DELETE: dueño o admin
-- =============================================================================
create policy "lost_pets: public read"
  on public.lost_pets for select
  using (true);

create policy "lost_pets: owner insert"
  on public.lost_pets for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "lost_pets: owner update"
  on public.lost_pets for update to authenticated
  using (owner_user_id = auth.uid() or public.is_admin())
  with check (owner_user_id = auth.uid() or public.is_admin());

create policy "lost_pets: owner delete"
  on public.lost_pets for delete to authenticated
  using (owner_user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- Policies: animals_for_adoption
-- Mismo patrón que lost_pets
-- =============================================================================
create policy "animals_for_adoption: public read"
  on public.animals_for_adoption for select
  using (true);

create policy "animals_for_adoption: owner insert"
  on public.animals_for_adoption for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "animals_for_adoption: owner update"
  on public.animals_for_adoption for update to authenticated
  using (owner_user_id = auth.uid() or public.is_admin())
  with check (owner_user_id = auth.uid() or public.is_admin());

create policy "animals_for_adoption: owner delete"
  on public.animals_for_adoption for delete to authenticated
  using (owner_user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- Policies: profiles
-- - SELECT: cada uno ve lo suyo; admin ve todo
-- - UPDATE: cada uno edita lo suyo (sin cambiar role — ver trigger); admin edita
--   cualquiera
-- - INSERT: bloqueado vía API. El trigger handle_new_user lo hace en el signup.
-- - DELETE: bloqueado vía API. Cascade desde auth.users.
-- =============================================================================
create policy "profiles: self or admin read"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles: self or admin update"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
