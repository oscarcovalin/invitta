create table "public"."clientes" (
  "id"             uuid                     not null default gen_random_uuid(),
  "nombre"         text                     not null,
  "email_contacto" text,
  "telefono"       text,
  "plan"           text                     not null default 'demo'::text,
  "estado"         text                     not null default 'activo'::text,
  "created_at"     timestamp with time zone not null default now(),
  "updated_at"     timestamp with time zone not null default now(),
  "studio_id"      uuid,
  constraint "clientes_estado_check" check ((estado = ANY (ARRAY['activo'::text, 'pausado'::text, 'cancelado'::text]))),
  constraint "clientes_pkey" primary key (id),
  constraint "clientes_studio_id_fkey" foreign key (studio_id) references public.studios(id) on delete set null
);

alter table "public"."clientes"
  enable row level security;

create unique index clientes_studio_id_unique_idx on public.clientes using btree (studio_id)
  where (studio_id is not null);

create trigger set_clientes_updated_at
  before update on public.clientes
  for each row
  execute function public.set_updated_at();

create policy "clientes_select_members" on "public"."clientes"
  for select
  to PUBLIC
  using (public.is_cliente_member(id));

create policy "clientes_select_own" on "public"."clientes"
  for select
  to "authenticated"
  using ((exists ( select 1
   from public.cliente_usuarios cu
  where ((cu.cliente_id = clientes.id) AND (cu.user_id = auth.uid())))));

create policy "clientes_update_admins" on "public"."clientes"
  for update
  to PUBLIC
  using ((exists ( select 1
   from public.cliente_usuarios cu
  where ((cu.cliente_id = clientes.id) AND (cu.user_id = auth.uid()) AND (cu.rol = ANY (ARRAY['owner'::text, 'admin'::text]))))))
  with check ((EXISTS ( SELECT 1
   FROM public.cliente_usuarios cu
  WHERE ((cu.cliente_id = clientes.id) AND (cu.user_id = auth.uid()) AND (cu.rol = ANY (ARRAY['owner'::text, 'admin'::text]))))));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."clientes" to "anon", "authenticated", "postgres", "service_role";
