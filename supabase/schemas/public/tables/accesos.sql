create table "public"."accesos" (
  "id"            uuid                     not null default gen_random_uuid(),
  "evento_id"     uuid                     not null,
  "invitado_id"   uuid                     not null,
  "qr_token"      text                     not null,
  "pases_usados"  integer                  not null default 1,
  "status"        text                     not null default 'validado'::text,
  "checked_in_by" uuid,
  "checked_in_at" timestamp with time zone not null default now(),
  "created_at"    timestamp with time zone not null default now(),
  constraint "accesos_checked_in_by_fkey" foreign key (checked_in_by) references auth.users(id) on delete set null,
  constraint "accesos_pases_usados_check" check ((pases_usados > 0)),
  constraint "accesos_pkey" primary key (id),
  constraint "accesos_status_check" check ((status = ANY (ARRAY['validado'::text, 'duplicado'::text, 'rechazado'::text, 'manual'::text]))),
  constraint "accesos_evento_id_fkey" foreign key (evento_id) references public.eventos(id) on delete cascade,
  constraint "accesos_invitado_id_fkey" foreign key (invitado_id) references public.invitados(id) on delete cascade
);

alter table "public"."accesos"
  enable row level security;

create index idx_accesos_evento_id on public.accesos using btree (evento_id);

create index idx_accesos_invitado_id on public.accesos using btree (invitado_id);

create policy "accesos_insert_event_staff" on "public"."accesos"
  for insert
  to PUBLIC
  with check (((public.current_user_event_role(evento_id) = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])) AND (checked_in_by = auth.uid())));

create policy "accesos_select_event_members" on "public"."accesos"
  for select
  to PUBLIC
  using (public.is_event_member(evento_id));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."accesos" to "anon", "authenticated", "postgres", "service_role";
