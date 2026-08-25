create table "public"."checkins" (
  "id"          uuid                     not null default gen_random_uuid(),
  "evento_id"   uuid                     not null,
  "invitado_id" uuid,
  "qr_token"    text,
  "scanned_by"  uuid,
  "scanned_at"  timestamp with time zone not null default now(),
  "status"      text                     not null,
  "notes"       text,
  "created_at"  timestamp with time zone not null default now(),
  constraint "checkins_pkey" primary key (id),
  constraint "checkins_scanned_by_fkey" foreign key (scanned_by) references auth.users(id) on delete set null,
  constraint "checkins_status_check" check ((status = ANY (ARRAY['valid'::text, 'duplicate'::text, 'invalid'::text, 'cancelled'::text]))),
  constraint "checkins_evento_id_fkey" foreign key (evento_id) references public.eventos(id) on delete cascade,
  constraint "checkins_invitado_id_fkey" foreign key (invitado_id) references public.invitados(id) on delete set null
);

alter table "public"."checkins"
  enable row level security;

create index checkins_evento_id_idx on public.checkins using btree (evento_id);

create index checkins_invitado_id_idx on public.checkins using btree (invitado_id);

create index checkins_qr_token_idx on public.checkins using btree (qr_token);

create policy "checkins_insert_own_event" on "public"."checkins"
  for insert
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM (public.eventos e
     JOIN public.cliente_usuarios cu ON ((cu.cliente_id = e.cliente_id)))
  WHERE ((e.id = checkins.evento_id) AND (cu.user_id = auth.uid()) AND (cu.rol = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text]))))));

create policy "checkins_select_own_event" on "public"."checkins"
  for select
  to "authenticated"
  using ((exists ( select 1
   from (public.eventos e
     JOIN public.cliente_usuarios cu on ((cu.cliente_id = e.cliente_id)))
  where ((e.id = checkins.evento_id) AND (cu.user_id = auth.uid())))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."checkins" to "anon", "authenticated", "postgres", "service_role";
