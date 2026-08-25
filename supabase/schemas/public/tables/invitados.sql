create table "public"."invitados" (
  "id"                uuid                     not null default gen_random_uuid(),
  "evento_id"         uuid                     not null,
  "nombre"            text                     not null,
  "familia"           text,
  "email"             text,
  "telefono"          text,
  "mesa"              text,
  "pases_asignados"   integer                  not null default 1,
  "pases_confirmados" integer                  not null default 0,
  "estado"            text                     not null default 'Pendiente'::text,
  "qr_token"          text                     not null default (gen_random_uuid())::text,
  "notas"             text,
  "confirmed_at"      timestamp with time zone,
  "created_at"        timestamp with time zone not null default now(),
  "updated_at"        timestamp with time zone not null default now(),
  "qr_status"         text                     not null default 'active'::text,
  "checked_in"        boolean                  not null default false,
  "checked_in_at"     timestamp with time zone,
  "checked_in_by"     uuid,
  constraint "invitados_checked_in_by_fkey" foreign key (checked_in_by) references auth.users(id) on delete set null,
  constraint "invitados_estado_check" check ((estado = ANY (ARRAY['Confirmado'::text, 'Pendiente'::text, 'No asistira'::text, 'No asistirá'::text]))),
  constraint "invitados_evento_id_fkey" foreign key (evento_id) references public.eventos(id) on delete cascade,
  constraint "invitados_pases_asignados_check" check ((pases_asignados >= 0)),
  constraint "invitados_pases_confirmados_check" check ((pases_confirmados >= 0)),
  constraint "invitados_pkey" primary key (id),
  constraint "invitados_qr_status_check" check ((qr_status = ANY (ARRAY['active'::text, 'used'::text, 'cancelled'::text]))),
  constraint "invitados_qr_token_key" unique (qr_token)
);

alter table "public"."invitados"
  enable row level security;

create index idx_invitados_evento_id on public.invitados using btree (evento_id);

create index idx_invitados_qr_token on public.invitados using btree (qr_token);

create unique index invitados_qr_token_unique_idx on public.invitados using btree (qr_token)
  where (qr_token is not null);

create trigger set_invitados_updated_at
  before update on public.invitados
  for each row
  execute function public.set_updated_at();

create policy "invitados_delete_event_admins" on "public"."invitados"
  for delete
  to PUBLIC
  using ((public.current_user_event_role(evento_id) = ANY (ARRAY['owner'::text, 'admin'::text])));

create policy "invitados_insert_event_admins" on "public"."invitados"
  for insert
  to PUBLIC
  with check ((public.current_user_event_role(evento_id) = ANY (ARRAY['owner'::text, 'admin'::text])));

create policy "invitados_select_event_members" on "public"."invitados"
  for select
  to PUBLIC
  using (public.is_event_member(evento_id));

create policy "invitados_select_own_event" on "public"."invitados"
  for select
  to "authenticated"
  using ((exists ( select 1
   from (public.eventos e
     JOIN public.cliente_usuarios cu on ((cu.cliente_id = e.cliente_id)))
  where ((e.id = invitados.evento_id) AND (cu.user_id = auth.uid())))));

create policy "invitados_update_event_admins" on "public"."invitados"
  for update
  to PUBLIC
  using ((public.current_user_event_role(evento_id) = ANY (ARRAY['owner'::text, 'admin'::text])))
  with check ((public.current_user_event_role(evento_id) = ANY (ARRAY['owner'::text, 'admin'::text])));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."invitados" to "anon", "authenticated", "postgres", "service_role";
