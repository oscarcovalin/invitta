-- Publicación independiente de invitaciones Invitta 2.
-- Es aditiva: no modifica invitaciones ni tablas heredadas.

alter table public.invitation_projects
  add column if not exists public_slug text,
  add column if not exists published_path text;

create unique index if not exists invitation_projects_public_slug_key
  on public.invitation_projects (public_slug)
  where public_slug is not null;

create or replace function public.publish_invitation_project(
  p_project_id uuid,
  p_slug text
)
returns table (slug text, storage_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_slug text := lower(trim(p_slug));
  path text;
begin
  if normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or length(normalized_slug) < 3
     or length(normalized_slug) > 80 then
    raise exception 'invalid public slug' using errcode = '22023';
  end if;

  if not private.invitta2_can_access_project(p_project_id, array['manager']) then
    raise exception 'not allowed to publish this project' using errcode = '42501';
  end if;

  path := p_project_id::text || '/published/index.html';

  update public.invitation_projects
     set public_slug = normalized_slug,
         published_path = path,
         status = 'active'
   where id = p_project_id;

  update public.invitation_designs
     set state = 'published',
         published_at = coalesce(published_at, now()),
         updated_by = (select auth.uid())
   where project_id = p_project_id;

  if not found then
    raise exception 'project has no invitation design' using errcode = 'P0002';
  end if;

  return query select normalized_slug, path;
end;
$$;

create or replace function public.get_published_invitation_path(p_slug text)
returns table (slug text, storage_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.public_slug, p.published_path
    from public.invitation_projects p
    join public.invitation_designs d on d.project_id = p.id
   where p.public_slug = lower(trim(p_slug))
     and p.status = 'active'
     and d.state = 'published'
     and p.published_path is not null
   limit 1;
$$;

insert into storage.buckets (id, name, public)
values ('invitta-2-published', 'invitta-2-published', true)
on conflict (id) do update set public = true;

create policy invitta2_published_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'invitta-2-published'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, array['manager'])
);

create policy invitta2_published_update on storage.objects
for update to authenticated
using (
  bucket_id = 'invitta-2-published'
  and private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, array['manager'])
)
with check (
  bucket_id = 'invitta-2-published'
  and private.invitta2_can_access_project(split_part(name, '/', 1)::uuid, array['manager'])
);

revoke all on function public.publish_invitation_project(uuid, text) from public;
revoke all on function public.get_published_invitation_path(text) from public;
grant execute on function public.publish_invitation_project(uuid, text) to authenticated;
grant execute on function public.get_published_invitation_path(text) to anon, authenticated;
