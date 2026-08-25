-- Premium shared content: optional lodging data and private guest photo albums.
-- Guest uploads are mediated by the server API; no public Storage policies are created.

alter table public.studio_invitations
  add column if not exists shared_album_enabled boolean not null default false,
  add column if not exists lodging_options jsonb not null default '[]'::jsonb;

alter table public.studio_invitations
  drop constraint if exists studio_invitations_lodging_options_is_array;

alter table public.studio_invitations
  add constraint studio_invitations_lodging_options_is_array
  check (jsonb_typeof(lodging_options) = 'array');

comment on column public.studio_invitations.shared_album_enabled is
  'Enables the premium guest photo album for this invitation.';
comment on column public.studio_invitations.lodging_options is
  'Optional lodging cards. Each item contains name, address, phone and map_url.';

create table if not exists public.invitation_album_photos (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.studio_invitations(id) on delete cascade,
  storage_path text not null unique,
  guest_name text not null check (char_length(guest_name) between 1 and 120),
  message text null check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists invitation_album_photos_invitation_created_idx
  on public.invitation_album_photos (invitation_id, created_at desc);

alter table public.invitation_album_photos enable row level security;
revoke all on table public.invitation_album_photos from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-album',
  'invitation-album',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
