create table "public"."confirmaciones" (
  "id"                uuid                     not null default gen_random_uuid(),
  "evento_id"         uuid                     not null,
  "invitado_id"       uuid                     not null,
  "asiste"            boolean                  not null,
  "pases_confirmados" integer                  not null default 0,
  "mensaje"           text,
  "origen"            text                     not null default 'dashboard'::text,
  "confirmed_at"      timestamp with time zone not null default now(),
  "created_at"        timestamp with time zone not null default now(),
  constraint "confirmaciones_origen_check" check ((origen = ANY (ARRAY['dashboard'::text, 'invitacion'::text, 'whatsapp'::text, 'manual'::text]))),
  constraint "confirmaciones_pases_confirmados_check" check ((pases_confirmados >= 0)),
  constraint "confirmaciones_pkey" primary key (id),
  constraint "confirmaciones_evento_id_fkey" foreign key (evento_id) references public.eventos(id) on delete cascade,
  constraint "confirmaciones_invitado_id_fkey" foreign key (invitado_id) references public.invitados(id) on delete cascade
);

alter table "public"."confirmaciones"
  enable row level security;

create index idx_confirmaciones_evento_id on public.confirmaciones using btree (evento_id);

create index idx_confirmaciones_invitado_id on public.confirmaciones using btree (invitado_id);

create policy "confirmaciones_insert_event_admins" on "public"."confirmaciones"
  for insert
  to PUBLIC
  with check ((public.current_user_event_role(evento_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text, 'cliente'::text])));

create policy "confirmaciones_select_event_members" on "public"."confirmaciones"
  for select
  to PUBLIC
  using (public.is_event_member(evento_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."confirmaciones" to "anon", "authenticated", "postgres", "service_role";
