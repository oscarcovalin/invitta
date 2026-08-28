create table if not exists public.invitation_guest_links (
  project_id uuid not null references public.invitation_projects(id) on delete cascade,
  guest_id text not null,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  last_responded_at timestamptz,
  primary key (project_id, guest_id),
  unique (token)
);

comment on table public.invitation_guest_links is
  'Opaque capability links for public guest RSVP. Tokens are readable only by the owning authenticated user and the guest-rsvp Edge Function.';

alter table public.invitation_guest_links enable row level security;

revoke all on table public.invitation_guest_links from anon;
grant select, insert, update, delete on table public.invitation_guest_links to authenticated;

drop policy if exists invitation_guest_links_owner_select on public.invitation_guest_links;
create policy invitation_guest_links_owner_select
on public.invitation_guest_links
for select
to authenticated
using (
  exists (
    select 1
    from public.invitation_projects p
    where p.id = invitation_guest_links.project_id
      and p.owner_id = (select auth.uid())
  )
);

drop policy if exists invitation_guest_links_owner_insert on public.invitation_guest_links;
create policy invitation_guest_links_owner_insert
on public.invitation_guest_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.invitation_projects p
    where p.id = invitation_guest_links.project_id
      and p.owner_id = (select auth.uid())
      and p.status <> 'archived'
  )
);

drop policy if exists invitation_guest_links_owner_update on public.invitation_guest_links;
create policy invitation_guest_links_owner_update
on public.invitation_guest_links
for update
to authenticated
using (
  exists (
    select 1
    from public.invitation_projects p
    where p.id = invitation_guest_links.project_id
      and p.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.invitation_projects p
    where p.id = invitation_guest_links.project_id
      and p.owner_id = (select auth.uid())
      and p.status <> 'archived'
  )
);

drop policy if exists invitation_guest_links_owner_delete on public.invitation_guest_links;
create policy invitation_guest_links_owner_delete
on public.invitation_guest_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.invitation_projects p
    where p.id = invitation_guest_links.project_id
      and p.owner_id = (select auth.uid())
  )
);

-- The unique constraint on token already provides the lookup index used by the
-- public RSVP function. Avoid a second, redundant token index.
drop index if exists public.invitation_guest_links_active_token_idx;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'invitation_operations'
  ) then
    alter publication supabase_realtime add table public.invitation_operations;
  end if;
end
$$;
