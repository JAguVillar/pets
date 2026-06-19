-- =============================================================================
-- Pets schema — migration inicial
-- Crea catálogos, tablas principales (lost_pets, animals_for_adoption),
-- indexes, triggers de updated_at y seeds de catálogos.
-- RLS habilitado en todas las tablas, SIN policies (se agregan en parte 2).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: trigger para mantener updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- Catálogos
-- =============================================================================

create table public.species (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  icon text
);
alter table public.species enable row level security;

create table public.breeds (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  species_id bigint not null references public.species(id) on delete restrict
);
alter table public.breeds enable row level security;

create table public.colors (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null
);
alter table public.colors enable row level security;

create table public.coat_types (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null
);
alter table public.coat_types enable row level security;

create table public.sexes (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null
);
alter table public.sexes enable row level security;

create table public.sizes (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);
alter table public.sizes enable row level security;

create table public.pet_status (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  color text not null
);
alter table public.pet_status enable row level security;

create table public.adoption_status (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  color text not null
);
alter table public.adoption_status enable row level security;

create table public.organizations (
  id bigint generated always as identity primary key,
  slug text unique,
  name text not null,
  email text,
  phone text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

-- =============================================================================
-- Tablas principales
-- =============================================================================

create table public.lost_pets (
  id uuid primary key default gen_random_uuid(),
  name text,
  description text,
  images text[] not null default '{}',
  breed_id bigint references public.breeds(id) on delete set null,
  status_id bigint not null references public.pet_status(id) on delete restrict,
  coat_type_id bigint references public.coat_types(id) on delete set null,
  color_id bigint references public.colors(id) on delete set null,
  sex_id bigint references public.sexes(id) on delete set null,
  size_id bigint references public.sizes(id) on delete set null,
  age_years numeric(4,1) check (age_years is null or age_years >= 0),
  last_seen_date date,
  last_seen_location text,
  last_seen_lat numeric(9,6),
  last_seen_lng numeric(9,6),
  reward numeric(12,2) check (reward is null or reward >= 0),
  reporter_name text,
  reporter_phone text,
  reporter_email text,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lost_pets_geo_paired check ((last_seen_lat is null) = (last_seen_lng is null))
);
alter table public.lost_pets enable row level security;

create table public.animals_for_adoption (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  images text[] not null default '{}',
  age_years numeric(4,1) check (age_years is null or age_years >= 0),
  breed_id bigint references public.breeds(id) on delete set null,
  status_id bigint not null references public.adoption_status(id) on delete restrict,
  coat_type_id bigint references public.coat_types(id) on delete set null,
  color_id bigint references public.colors(id) on delete set null,
  sex_id bigint references public.sexes(id) on delete set null,
  size_id bigint references public.sizes(id) on delete set null,
  organization_id bigint references public.organizations(id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.animals_for_adoption enable row level security;

-- =============================================================================
-- Indexes
-- =============================================================================

create index lost_pets_status_id_idx     on public.lost_pets (status_id);
create index lost_pets_breed_id_idx      on public.lost_pets (breed_id);
create index lost_pets_owner_user_id_idx on public.lost_pets (owner_user_id);
create index lost_pets_created_at_idx    on public.lost_pets (created_at desc);
create index lost_pets_search_idx        on public.lost_pets
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));

create index animals_for_adoption_status_id_idx       on public.animals_for_adoption (status_id);
create index animals_for_adoption_organization_id_idx on public.animals_for_adoption (organization_id);
create index animals_for_adoption_breed_id_idx        on public.animals_for_adoption (breed_id);
create index animals_for_adoption_owner_user_id_idx   on public.animals_for_adoption (owner_user_id);
create index animals_for_adoption_created_at_idx      on public.animals_for_adoption (created_at desc);
create index animals_for_adoption_search_idx          on public.animals_for_adoption
  using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));

create index breeds_species_id_idx on public.breeds (species_id);

-- =============================================================================
-- Triggers updated_at
-- =============================================================================

create trigger lost_pets_set_updated_at
  before update on public.lost_pets
  for each row execute function public.set_updated_at();

create trigger animals_for_adoption_set_updated_at
  before update on public.animals_for_adoption
  for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Seeds (idempotentes via on conflict)
-- =============================================================================

insert into public.species (slug, name, icon) values
  ('perro', 'Perro', 'lucide:dog'),
  ('gato',  'Gato',  'lucide:cat'),
  ('otro',  'Otro',  'lucide:paw-print')
on conflict (slug) do nothing;

insert into public.sexes (slug, name) values
  ('macho',       'Macho'),
  ('hembra',      'Hembra'),
  ('desconocido', 'Desconocido')
on conflict (slug) do nothing;

insert into public.sizes (slug, name, sort_order) values
  ('chico',   'Chico',   1),
  ('mediano', 'Mediano', 2),
  ('grande',  'Grande',  3),
  ('gigante', 'Gigante', 4)
on conflict (slug) do nothing;

insert into public.colors (slug, name) values
  ('negro',    'Negro'),
  ('blanco',   'Blanco'),
  ('marron',   'Marrón'),
  ('gris',     'Gris'),
  ('atigrado', 'Atigrado'),
  ('naranja',  'Naranja'),
  ('dorado',   'Dorado'),
  ('manchado', 'Manchado'),
  ('tricolor', 'Tricolor')
on conflict (slug) do nothing;

insert into public.coat_types (slug, name) values
  ('corto',    'Corto'),
  ('medio',    'Medio'),
  ('largo',    'Largo'),
  ('rizado',   'Rizado'),
  ('sin_pelo', 'Sin pelo')
on conflict (slug) do nothing;

insert into public.pet_status (slug, name, color) values
  ('lost',     'Perdida',    '#ef4444'),
  ('found',    'Encontrada', '#f59e0b'),
  ('reunited', 'Reunida',    '#22c55e'),
  ('closed',   'Cerrada',    '#6b7280')
on conflict (slug) do nothing;

insert into public.adoption_status (slug, name, color) values
  ('available',   'Disponible',    '#22c55e'),
  ('reserved',    'Reservada',     '#f59e0b'),
  ('adopted',     'Adoptada',      '#3b82f6'),
  ('unavailable', 'No disponible', '#6b7280')
on conflict (slug) do nothing;

-- Una raza "mestizo" por especie como fallback genérico
insert into public.breeds (slug, name, species_id) values
  ('mestizo-perro', 'Mestizo', (select id from public.species where slug = 'perro')),
  ('mestizo-gato',  'Mestizo', (select id from public.species where slug = 'gato')),
  ('mestizo-otro',  'Mestizo', (select id from public.species where slug = 'otro'))
on conflict (slug) do nothing;
