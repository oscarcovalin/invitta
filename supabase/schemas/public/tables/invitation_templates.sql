create table "public"."invitation_templates" (
  "id"            uuid                     not null default gen_random_uuid(),
  "name"          text                     not null,
  "event_type"    text                     default 'general'::text,
  "thumbnail_url" text,
  "config"        jsonb                    default '{}'::jsonb,
  "active"        boolean                  default true,
  "created_at"    timestamp with time zone default now(),
  "updated_at"    timestamp with time zone default now(),
  constraint "invitation_templates_pkey" primary key (id)
);

alter table "public"."invitation_templates"
  enable row level security;

create index idx_invitation_templates_active on public.invitation_templates using btree (active);

create index idx_invitation_templates_event_type on public.invitation_templates using btree (event_type);

create trigger set_invitation_templates_updated_at
  before update on public.invitation_templates
  for each row
  execute function public.set_updated_at();

create policy "templates_select_active_authenticated" on "public"."invitation_templates"
  for select
  to "authenticated"
  using ((active = true));

create policy "templates_select_active_public" on "public"."invitation_templates"
  for select
  to "anon"
  using ((active = true));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."invitation_templates" to "anon", "authenticated", "postgres", "service_role";

comment on column "public"."invitation_templates"."config" is 'Configuración visual de la plantilla en formato JSON.';

comment on table "public"."invitation_templates" is 'Plantillas reutilizables para invitaciones digitales.';
