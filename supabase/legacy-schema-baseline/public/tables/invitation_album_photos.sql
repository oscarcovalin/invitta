create table "public"."invitation_album_photos" (
  "id"            uuid                     not null default gen_random_uuid(),
  "invitation_id" uuid                     not null,
  "storage_path"  text                     not null,
  "guest_name"    text                     not null,
  "message"       text,
  "created_at"    timestamp with time zone not null default now(),
  constraint "invitation_album_photos_guest_name_check" check (((char_length(guest_name) >= 1) AND (char_length(guest_name) <= 120))),
  constraint "invitation_album_photos_message_check" check (((message IS NULL) OR (char_length(message) <= 500))),
  constraint "invitation_album_photos_pkey" primary key (id),
  constraint "invitation_album_photos_storage_path_key" unique (storage_path),
  constraint "invitation_album_photos_invitation_id_fkey" foreign key (invitation_id) references public.studio_invitations(id) on delete cascade
);

alter table "public"."invitation_album_photos"
  enable row level security;

create index invitation_album_photos_invitation_created_idx on public.invitation_album_photos using btree (invitation_id, created_at desc);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."invitation_album_photos" to "postgres", "service_role";
