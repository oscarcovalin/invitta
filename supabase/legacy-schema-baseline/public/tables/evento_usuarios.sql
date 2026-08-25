create table "public"."evento_usuarios" (
  "evento_id"  uuid                     not null,
  "user_id"    uuid                     not null,
  "rol"        text                     not null default 'cliente'::text,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "evento_usuarios_pkey" primary key (evento_id, user_id),
  constraint "evento_usuarios_rol_check" check ((rol = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text, 'cliente'::text]))),
  constraint "evento_usuarios_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade,
  constraint "evento_usuarios_evento_id_fkey" foreign key (evento_id) references public.eventos(id) on delete cascade
);

alter table "public"."evento_usuarios"
  enable row level security;

create index evento_usuarios_user_id_idx on public.evento_usuarios using btree (user_id);

create policy "evento_usuarios_select_own" on "public"."evento_usuarios"
  for select
  to PUBLIC
  using ((user_id = auth.uid()));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."evento_usuarios" to "anon", "authenticated", "postgres", "service_role";

comment on table "public"."evento_usuarios" is 'Event-scoped dashboard access. Keeps end clients isolated from other Studio events.';
