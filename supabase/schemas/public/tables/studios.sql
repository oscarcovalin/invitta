create table "public"."studios" (
  "id"                    uuid                     not null default gen_random_uuid(),
  "user_id"               uuid                     not null,
  "name"                  text                     not null,
  "logo_url"              text,
  "whatsapp"              text,
  "brand_color_primary"   text                     default '#111111'::text,
  "brand_color_secondary" text                     default '#d4af37'::text,
  "brand_font_family"     text                     default 'Inter'::text,
  "plan"                  text                     default 'pilot'::text,
  "active"                boolean                  default true,
  "created_at"            timestamp with time zone default now(),
  "updated_at"            timestamp with time zone default now(),
  "plan_tier"             text                     not null default 'beta'::text,
  "available_credits"     integer                  not null default 0,
  "used_credits"          integer                  not null default 0,
  constraint "studios_available_credits_non_negative" check ((available_credits >= 0)),
  constraint "studios_pkey" primary key (id),
  constraint "studios_used_credits_non_negative" check ((used_credits >= 0)),
  constraint "studios_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade
);

alter table "public"."studios"
  enable row level security;

create index idx_studios_active on public.studios using btree (active);

create unique index idx_studios_unique_user_id on public.studios using btree (user_id);

create index idx_studios_user_id on public.studios using btree (user_id);

create trigger set_studios_updated_at
  before update on public.studios
  for each row
  execute function public.set_updated_at();

create policy "studios_delete_managers" on "public"."studios"
  for delete
  to "authenticated"
  using (public.is_invitta_studio_manager(id));

create policy "studios_insert_own" on "public"."studios"
  for insert
  to "authenticated"
  with check ((auth.uid() = user_id));

create policy "studios_select_members" on "public"."studios"
  for select
  to "authenticated"
  using (public.is_invitta_studio_member(id));

create policy "studios_update_managers" on "public"."studios"
  for update
  to "authenticated"
  using (public.is_invitta_studio_manager(id))
  with check (public.is_invitta_studio_manager(id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."studios" to "anon", "authenticated", "postgres", "service_role";

comment on column "public"."studios"."plan" is 'Plan comercial: pilot, starter, pro, studio, white_label.';

comment on column "public"."studios"."user_id" is 'Usuario autenticado propietario del estudio.';

comment on table "public"."studios" is 'Studios registrados para operar invitaciones digitales marca blanca dentro de Invitta Studio.';
