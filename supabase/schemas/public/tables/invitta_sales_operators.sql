create table "public"."invitta_sales_operators" (
  "user_id"    uuid                     not null,
  "created_at" timestamp with time zone not null default now(),
  constraint "invitta_sales_operators_pkey" primary key (user_id),
  constraint "invitta_sales_operators_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade
);

alter table "public"."invitta_sales_operators"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."invitta_sales_operators" to "postgres", "service_role";
