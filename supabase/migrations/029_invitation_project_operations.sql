-- Project-scoped operational state for seating and guest logistics.
-- This is intentionally separate from invitation design persistence.

create table public.invitation_operations (
  project_id uuid primary key
    references public.invitation_projects(id) on delete cascade,
  seating_state jsonb not null default '{"guests":[],"tables":[]}'::jsonb,
  guest_state jsonb not null default '{"config":{},"tables":[],"guests":[]}'::jsonb,
  version bigint not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_operations_seating_object
    check (jsonb_typeof(seating_state) = 'object'),
  constraint invitation_operations_guest_object
    check (jsonb_typeof(guest_state) = 'object'),
  constraint invitation_operations_seating_size
    check (octet_length(seating_state::text) <= 5242880),
  constraint invitation_operations_guest_size
    check (octet_length(guest_state::text) <= 5242880)
);

create index invitation_operations_updated_by_idx
  on public.invitation_operations (updated_by);
create index invitation_operations_created_by_idx
  on public.invitation_operations (created_by);

create or replace function public.invitta2_protect_operations_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id is distinct from old.project_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'operations identity fields are immutable' using errcode = '42501';
  end if;

  if new.version <> old.version + 1 then
    raise exception 'operations version must advance exactly once' using errcode = '40001';
  end if;

  return new;
end;
$$;

create trigger invitation_operations_set_updated_at
before update on public.invitation_operations
for each row execute function public.invitta2_set_updated_at();

create trigger invitation_operations_protect_identity
before update on public.invitation_operations
for each row execute function public.invitta2_protect_operations_identity();

alter table public.invitation_operations enable row level security;

create policy invitation_operations_select on public.invitation_operations
for select to authenticated
using (private.invitta2_can_access_project(project_id, null));

create policy invitation_operations_insert on public.invitation_operations
for insert to authenticated
with check (
  version = 1
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and private.invitta2_can_access_project(project_id, array['manager', 'editor'])
  and exists (
    select 1 from public.invitation_projects p
    where p.id = project_id and p.status <> 'archived'
  )
);

create policy invitation_operations_update on public.invitation_operations
for update to authenticated
using (
  private.invitta2_can_access_project(project_id, array['manager', 'editor'])
  and exists (
    select 1 from public.invitation_projects p
    where p.id = project_id and p.status <> 'archived'
  )
)
with check (
  updated_by = (select auth.uid())
  and private.invitta2_can_access_project(project_id, array['manager', 'editor'])
  and exists (
    select 1 from public.invitation_projects p
    where p.id = project_id and p.status <> 'archived'
  )
);

create or replace function public.save_invitation_operations(
  p_project_id uuid,
  p_expected_version bigint,
  p_seating_state jsonb,
  p_guest_state jsonb
)
returns public.invitation_operations
language plpgsql
set search_path = ''
as $$
declare
  current_version bigint;
  project_status text;
  saved public.invitation_operations;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not private.invitta2_can_access_project(
    p_project_id,
    array['manager', 'editor']
  ) then
    raise exception 'project edit access required' using errcode = '42501';
  end if;

  select p.status into project_status
  from public.invitation_projects p
  where p.id = p_project_id;

  if project_status is null then
    raise exception 'project not found' using errcode = 'P0002';
  end if;

  if project_status = 'archived' then
    raise exception 'archived projects are read-only' using errcode = '55000';
  end if;

  if jsonb_typeof(p_seating_state) <> 'object'
     or jsonb_typeof(p_guest_state) <> 'object' then
    raise exception 'operations state must be JSON objects' using errcode = '22023';
  end if;

  if p_expected_version = 0 then
    insert into public.invitation_operations (
      project_id,
      seating_state,
      guest_state,
      created_by,
      updated_by
    ) values (
      p_project_id,
      p_seating_state,
      p_guest_state,
      (select auth.uid()),
      (select auth.uid())
    )
    on conflict (project_id) do nothing
    returning * into saved;

    if saved.project_id is null then
      raise exception 'operations version conflict' using errcode = '40001';
    end if;

    return saved;
  end if;

  select o.version into current_version
  from public.invitation_operations o
  where o.project_id = p_project_id
  for update;

  if current_version is null then
    raise exception 'operations state not initialized' using errcode = 'P0002';
  end if;

  if current_version <> p_expected_version then
    raise exception 'operations version conflict' using errcode = '40001';
  end if;

  update public.invitation_operations
  set seating_state = p_seating_state,
      guest_state = p_guest_state,
      version = version + 1,
      updated_by = (select auth.uid())
  where project_id = p_project_id
  returning * into saved;

  return saved;
end;
$$;

revoke all on public.invitation_operations from anon;
grant select, insert, update on public.invitation_operations to authenticated;

revoke execute on function public.save_invitation_operations(uuid, bigint, jsonb, jsonb)
  from public, anon;
grant execute on function public.save_invitation_operations(uuid, bigint, jsonb, jsonb)
  to authenticated;

revoke execute on function public.invitta2_protect_operations_identity()
  from public, anon, authenticated;
