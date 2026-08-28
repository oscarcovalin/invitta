-- Invitta 2 Studio cloud persistence.
-- This migration is intentionally additive: it does not alter legacy invitations.

create schema if not exists private;

create table public.invitation_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 160),
  event_type text not null default 'otro'
    check (event_type in ('boda', 'xv', 'bautizo', 'cumpleanos', 'corporativo', 'otro')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitation_project_members (
  project_id uuid not null references public.invitation_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('manager', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.invitation_designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.invitation_projects(id) on delete cascade,
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  theme_name text not null default 'vino' check (length(theme_name) between 1 and 80),
  custom_theme jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_theme) = 'object'),
  version bigint not null default 1 check (version > 0),
  state text not null default 'draft' check (state in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((state = 'published' and published_at is not null) or state = 'draft')
);

create table public.invitation_design_versions (
  id bigint generated always as identity primary key,
  design_id uuid not null references public.invitation_designs(id) on delete cascade,
  version bigint not null check (version > 0),
  config jsonb not null check (jsonb_typeof(config) = 'object'),
  theme_name text not null,
  custom_theme jsonb not null default '{}'::jsonb check (jsonb_typeof(custom_theme) = 'object'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (design_id, version)
);

create index invitation_projects_owner_updated_idx
  on public.invitation_projects (owner_id, updated_at desc);
create index invitation_project_members_user_idx
  on public.invitation_project_members (user_id, project_id);
create index invitation_designs_created_by_idx on public.invitation_designs (created_by);
create index invitation_designs_updated_by_idx on public.invitation_designs (updated_by);
create index invitation_design_versions_created_by_idx
  on public.invitation_design_versions (created_by);
create index invitation_design_versions_design_created_idx
  on public.invitation_design_versions (design_id, created_at desc);

create or replace function private.invitta2_is_project_owner(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.owner_id = (select auth.uid())
     from public.invitation_projects p
     where p.id = target_project_id),
    false
  );
$$;

create or replace function private.invitta2_can_access_project(
  target_project_id uuid,
  allowed_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.invitation_projects p
        where p.id = target_project_id and p.owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.invitation_project_members m
        where m.project_id = target_project_id
          and m.user_id = (select auth.uid())
          and (allowed_roles is null or m.role = any(allowed_roles))
      )
    );
$$;

create or replace function public.invitta2_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.invitta2_protect_project_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id
     or new.created_at is distinct from old.created_at then
    raise exception 'project ownership and creation time are immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.invitta2_protect_design_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.project_id is distinct from old.project_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'design identity fields are immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.invitta2_capture_initial_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  insert into public.invitation_design_versions
    (design_id, version, config, theme_name, custom_theme, created_by)
  values
    (new.id, new.version, new.config, new.theme_name, new.custom_theme, new.created_by);
  return new;
end;
$$;

create trigger invitation_projects_set_updated_at
before update on public.invitation_projects
for each row execute function public.invitta2_set_updated_at();
create trigger invitation_projects_protect_identity
before update on public.invitation_projects
for each row execute function public.invitta2_protect_project_identity();
create trigger invitation_designs_set_updated_at
before update on public.invitation_designs
for each row execute function public.invitta2_set_updated_at();
create trigger invitation_designs_protect_identity
before update on public.invitation_designs
for each row execute function public.invitta2_protect_design_identity();
create trigger invitation_designs_capture_initial_version
after insert on public.invitation_designs
for each row execute function public.invitta2_capture_initial_version();

alter table public.invitation_projects enable row level security;
alter table public.invitation_project_members enable row level security;
alter table public.invitation_designs enable row level security;
alter table public.invitation_design_versions enable row level security;

create policy invitation_projects_select on public.invitation_projects
for select to authenticated using (
  owner_id = (select auth.uid())
  or private.invitta2_can_access_project(id, null)
);
create policy invitation_projects_insert on public.invitation_projects
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy invitation_projects_update on public.invitation_projects
for update to authenticated
using (
  owner_id = (select auth.uid())
  or private.invitta2_can_access_project(id, array['manager'])
)
with check (
  owner_id = (select auth.uid())
  or private.invitta2_can_access_project(id, array['manager'])
);
create policy invitation_projects_delete on public.invitation_projects
for delete to authenticated using (
  owner_id = (select auth.uid())
  or private.invitta2_can_access_project(id, array['manager'])
);

create policy invitation_project_members_select on public.invitation_project_members
for select to authenticated
using (user_id = (select auth.uid()) or private.invitta2_is_project_owner(project_id));
create policy invitation_project_members_insert on public.invitation_project_members
for insert to authenticated with check (private.invitta2_is_project_owner(project_id));
create policy invitation_project_members_update on public.invitation_project_members
for update to authenticated
using (private.invitta2_is_project_owner(project_id))
with check (private.invitta2_is_project_owner(project_id));
create policy invitation_project_members_delete on public.invitation_project_members
for delete to authenticated
using (user_id = (select auth.uid()) or private.invitta2_is_project_owner(project_id));

create policy invitation_designs_select on public.invitation_designs
for select to authenticated using (private.invitta2_can_access_project(project_id, null));
create policy invitation_designs_insert on public.invitation_designs
for insert to authenticated with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and private.invitta2_can_access_project(project_id, array['manager', 'editor'])
);
create policy invitation_designs_update on public.invitation_designs
for update to authenticated
using (private.invitta2_can_access_project(project_id, array['manager', 'editor']))
with check (
  updated_by = (select auth.uid())
  and private.invitta2_can_access_project(project_id, array['manager', 'editor'])
);
create policy invitation_designs_delete on public.invitation_designs
for delete to authenticated
using (private.invitta2_can_access_project(project_id, array['manager']));

create policy invitation_design_versions_select on public.invitation_design_versions
for select to authenticated using (
  exists (
    select 1 from public.invitation_designs d
    where d.id = design_id and private.invitta2_can_access_project(d.project_id, null)
  )
);
create policy invitation_design_versions_insert on public.invitation_design_versions
for insert to authenticated with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.invitation_designs d
    where d.id = design_id
      and private.invitta2_can_access_project(d.project_id, array['manager', 'editor'])
  )
);

create or replace function public.save_invitation_design(
  p_design_id uuid,
  p_expected_version bigint,
  p_config jsonb,
  p_theme_name text,
  p_custom_theme jsonb default '{}'::jsonb
)
returns public.invitation_designs
language plpgsql
set search_path = ''
as $$
declare
  saved public.invitation_designs;
begin
  if jsonb_typeof(p_config) <> 'object' then
    raise exception 'config must be a JSON object' using errcode = '22023';
  end if;

  update public.invitation_designs
  set config = p_config,
      theme_name = coalesce(nullif(trim(p_theme_name), ''), theme_name),
      custom_theme = coalesce(p_custom_theme, '{}'::jsonb),
      version = version + 1,
      updated_by = (select auth.uid())
  where id = p_design_id and version = p_expected_version
  returning * into saved;

  if saved.id is null then
    raise exception 'design version conflict' using errcode = '40001';
  end if;

  insert into public.invitation_design_versions
    (design_id, version, config, theme_name, custom_theme, created_by)
  values
    (saved.id, saved.version, saved.config, saved.theme_name, saved.custom_theme,
     (select auth.uid()));
  return saved;
end;
$$;

insert into storage.buckets (id, name, public)
values ('invitta-2-assets', 'invitta-2-assets', false)
on conflict (id) do nothing;

create policy invitta2_assets_select on storage.objects
for select to authenticated using (
  bucket_id = 'invitta-2-assets'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, null)
    else false
  end
);
create policy invitta2_assets_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'invitta-2-assets' and owner_id = (select auth.uid())::text
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, array['manager', 'editor'])
    else false
  end
);
create policy invitta2_assets_update on storage.objects
for update to authenticated
using (
  bucket_id = 'invitta-2-assets' and owner_id = (select auth.uid())::text
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, array['manager', 'editor'])
    else false
  end
)
with check (
  bucket_id = 'invitta-2-assets' and owner_id = (select auth.uid())::text
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, array['manager', 'editor'])
    else false
  end
);
create policy invitta2_assets_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'invitta-2-assets' and owner_id = (select auth.uid())::text
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, array['manager', 'editor'])
    else false
  end
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.invitation_projects to authenticated;
grant select, insert, update, delete on public.invitation_project_members to authenticated;
grant select, insert, update, delete on public.invitation_designs to authenticated;
grant select, insert on public.invitation_design_versions to authenticated;
grant usage, select on sequence public.invitation_design_versions_id_seq to authenticated;
grant execute on function private.invitta2_is_project_owner(uuid) to authenticated;
grant execute on function private.invitta2_can_access_project(uuid, text[]) to authenticated;
grant execute on function public.save_invitation_design(uuid, bigint, jsonb, text, jsonb)
  to authenticated;
