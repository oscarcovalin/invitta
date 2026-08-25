create table "public"."eventos" (
  "id"           uuid                     not null default gen_random_uuid(),
  "cliente_id"   uuid                     not null,
  "nombre"       text                     not null,
  "tipo"         text                     not null default 'boda'::text,
  "slug"         text                     not null,
  "fecha_evento" timestamp with time zone,
  "ubicacion"    text,
  "config"       jsonb                    not null default '{}'::jsonb,
  "theme"        jsonb                    not null default '{}'::jsonb,
  "estado"       text                     not null default 'activo'::text,
  "created_at"   timestamp with time zone not null default now(),
  "updated_at"   timestamp with time zone not null default now(),
  constraint "eventos_cliente_id_fkey" foreign key (cliente_id) references public.clientes(id) on delete cascade,
  constraint "eventos_estado_check" check ((estado = ANY (ARRAY['borrador'::text, 'activo'::text, 'archivado'::text]))),
  constraint "eventos_pkey" primary key (id),
  constraint "eventos_slug_key" unique (slug),
  constraint "eventos_tipo_check" check ((tipo = ANY (ARRAY['boda'::text, 'xv'::text, 'bautizo'::text, 'cumpleanos'::text, 'corporativo'::text, 'otro'::text])))
);

alter table "public"."eventos"
  enable row level security;

create index idx_eventos_cliente_id on public.eventos using btree (cliente_id);

create index idx_eventos_slug on public.eventos using btree (slug);

create trigger set_eventos_updated_at
  before update on public.eventos
  for each row
  execute function public.set_updated_at();

create policy "eventos_insert_admins" on "public"."eventos"
  for insert
  to PUBLIC
  with check ((EXISTS ( SELECT 1
   FROM public.cliente_usuarios cu
  WHERE ((cu.cliente_id = eventos.cliente_id) AND (cu.user_id = auth.uid()) AND (cu.rol = ANY (ARRAY['owner'::text, 'admin'::text]))))));

create policy "eventos_select_direct_members" on "public"."eventos"
  for select
  to PUBLIC
  using ((exists ( select 1
   from public.evento_usuarios eu
  where ((eu.evento_id = eventos.id) AND (eu.user_id = auth.uid())))));

create policy "eventos_select_members" on "public"."eventos"
  for select
  to PUBLIC
  using (public.is_cliente_member(cliente_id));

create policy "eventos_select_own" on "public"."eventos"
  for select
  to "authenticated"
  using ((exists ( select 1
   from public.cliente_usuarios cu
  where ((cu.cliente_id = eventos.cliente_id) AND (cu.user_id = auth.uid())))));

create policy "eventos_update_admins" on "public"."eventos"
  for update
  to PUBLIC
  using ((exists ( select 1
   from public.cliente_usuarios cu
  where ((cu.cliente_id = eventos.cliente_id) AND (cu.user_id = auth.uid()) AND (cu.rol = ANY (ARRAY['owner'::text, 'admin'::text]))))))
  with check ((EXISTS ( SELECT 1
   FROM public.cliente_usuarios cu
  WHERE ((cu.cliente_id = eventos.cliente_id) AND (cu.user_id = auth.uid()) AND (cu.rol = ANY (ARRAY['owner'::text, 'admin'::text]))))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."eventos" to "anon", "authenticated", "postgres", "service_role";
