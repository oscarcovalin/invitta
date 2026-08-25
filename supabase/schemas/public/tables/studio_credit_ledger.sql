create table "public"."studio_credit_ledger" (
  "id"               uuid                     not null default gen_random_uuid(),
  "studio_id"        uuid                     not null,
  "operator_user_id" uuid,
  "delta_credits"    integer                  not null,
  "balance_after"    integer                  not null,
  "transaction_type" text                     not null default 'manual_grant'::text,
  "reason"           text                     not null,
  "note"             text,
  "created_at"       timestamp with time zone not null default now(),
  "actor_user_id"    uuid                     not null,
  constraint "studio_credit_ledger_actor_user_id_fkey" foreign key (actor_user_id) references auth.users(id),
  constraint "studio_credit_ledger_balance_non_negative" check ((balance_after >= 0)),
  constraint "studio_credit_ledger_integrity" check ((((transaction_type = 'manual_grant'::text) AND (delta_credits > 0) AND (operator_user_id IS NOT NULL) AND (actor_user_id IS
    NOT NULL)) OR ((transaction_type = 'qr_activation'::text) AND (delta_credits < 0) AND (actor_user_id IS
    NOT NULL)) OR ((transaction_type = 'invitation_creation'::text) AND (delta_credits < 0) AND (actor_user_id IS NOT NULL)))),
  constraint "studio_credit_ledger_operator_user_id_fkey" foreign key (operator_user_id) references auth.users(id),
  constraint "studio_credit_ledger_pkey" primary key (id),
  constraint "studio_credit_ledger_reason_not_empty" check ((length(TRIM(BOTH FROM reason)) > 0)),
  constraint "studio_credit_ledger_studio_id_fkey" foreign key (studio_id) references public.studios(id) on delete cascade
);

alter table "public"."studio_credit_ledger"
  enable row level security;

create index idx_studio_credit_ledger_operator on public.studio_credit_ledger using btree (operator_user_id);

create index idx_studio_credit_ledger_studio_date on public.studio_credit_ledger using btree (studio_id, created_at desc);

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."studio_credit_ledger" to "anon", "authenticated", "postgres", "service_role";
