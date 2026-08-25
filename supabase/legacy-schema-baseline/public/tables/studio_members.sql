create table "public"."studio_members" (
  "studio_id"  uuid                     not null,
  "user_id"    uuid                     not null,
  "role"       text                     not null default 'editor'::text,
  "created_at" timestamp with time zone not null default now(),
  constraint "studio_members_pkey" primary key (studio_id, user_id),
  constraint "studio_members_role_check" check ((role = ANY (ARRAY['owner'::text, 'manager'::text, 'editor'::text]))),
  constraint "studio_members_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade,
  constraint "studio_members_studio_id_fkey" foreign key (studio_id) references public.studios(id) on delete cascade
);

alter table "public"."studio_members"
  enable row level security;

create policy "studio_members_select_own" on "public"."studio_members"
  for select
  to "authenticated"
  using ((user_id = auth.uid()));

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."studio_members" to "anon", "authenticated", "postgres", "service_role";
