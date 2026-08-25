create table "public"."cliente_usuarios" (
  "id"         uuid                     not null default gen_random_uuid(),
  "cliente_id" uuid                     not null,
  "user_id"    uuid                     not null,
  "rol"        text                     not null default 'cliente'::text,
  "created_at" timestamp with time zone not null default now(),
  constraint "cliente_usuarios_cliente_id_user_id_key" unique (cliente_id, user_id),
  constraint "cliente_usuarios_pkey" primary key (id),
  constraint "cliente_usuarios_rol_check" check ((rol = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text, 'cliente'::text]))),
  constraint "cliente_usuarios_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade,
  constraint "cliente_usuarios_cliente_id_fkey" foreign key (cliente_id) references public.clientes(id) on delete cascade
);

alter table "public"."cliente_usuarios"
  enable row level security;

create index idx_cliente_usuarios_user_id on public.cliente_usuarios using btree (user_id);

create policy "cliente_usuarios_select_own_clients" on "public"."cliente_usuarios"
  for select
  to PUBLIC
  using (((user_id = auth.uid()) or public.is_cliente_member(cliente_id)));

create policy "cliente_usuarios_select_own" on "public"."cliente_usuarios"
  for select
  to "authenticated"
  using ((user_id = auth.uid()));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."cliente_usuarios" to "anon", "authenticated", "postgres", "service_role";
