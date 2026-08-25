create table "public"."invitation_requests" (
  "id"                      uuid                     not null default gen_random_uuid(),
  "client_name"             text                     not null,
  "client_phone"            text                     not null,
  "event_type"              text                     not null,
  "design_name"             text,
  "requested_template_id"   text,
  "package_tier"            text                     not null default 'undecided'::text,
  "palette_preference"      text,
  "typography_preference"   text,
  "event_date"              date,
  "event_city"              text,
  "notes"                   text,
  "source"                  text                     not null default 'landing'::text,
  "status"                  text                     not null default 'new'::text,
  "assigned_studio_id"      uuid,
  "claimed_by"              uuid,
  "claimed_at"              timestamp with time zone,
  "converted_invitation_id" uuid,
  "created_at"              timestamp with time zone not null default now(),
  "updated_at"              timestamp with time zone not null default now(),
  "payment_status"          text                     not null default 'not_started'::text,
  "stripe_session_id"       text,
  "payment_method"          text,
  "payment_amount_mxn"      integer,
  "payment_email"           text,
  "paid_at"                 timestamp with time zone,
  constraint "invitation_requests_claimed_by_fkey" foreign key (claimed_by) references auth.users(id) on delete set null,
  constraint "invitation_requests_package_tier_check" check ((package_tier = ANY (ARRAY['essential'::text, 'premium'::text, 'vip'::text, 'undecided'::text]))),
  constraint "invitation_requests_payment_amount_mxn_check" check (((payment_amount_mxn IS NULL) OR (payment_amount_mxn > 0))),
  constraint "invitation_requests_payment_method_check" check (((payment_method IS NULL) OR (payment_method = ANY (ARRAY['card'::text, 'oxxo'::text])))),
  constraint "invitation_requests_payment_status_check" check ((payment_status = ANY (ARRAY['not_started'::text, 'pending'::text, 'paid'::text, 'failed'::text, 'expired'::text]))),
  constraint "invitation_requests_pkey" primary key (id),
  constraint "invitation_requests_source_check" check ((source = ANY (ARRAY['landing'::text, 'catalog'::text, 'whatsapp'::text, 'manual'::text]))),
  constraint "invitation_requests_status_check" check ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'in_progress'::text, 'won'::text, 'lost'::text]))),
  constraint "invitation_requests_converted_invitation_id_fkey" foreign key (converted_invitation_id) references public.studio_invitations(id) on delete set null,
  constraint "invitation_requests_assigned_studio_id_fkey" foreign key (assigned_studio_id) references public.studios(id) on delete set null
);

alter table "public"."invitation_requests"
  enable row level security;

create index invitation_requests_assigned_studio_idx on public.invitation_requests using btree (assigned_studio_id);

create index invitation_requests_payment_status_idx on public.invitation_requests using btree (payment_status, created_at desc);

create index invitation_requests_status_created_at_idx on public.invitation_requests using btree (status, created_at desc);

create unique index invitation_requests_stripe_session_idx on public.invitation_requests using btree (stripe_session_id)
  where (stripe_session_id is not null);

create trigger set_invitation_requests_updated_at
  before update on public.invitation_requests
  for each row
  execute function public.set_updated_at();

create policy "invitation_requests_public_insert" on "public"."invitation_requests"
  for insert
  to "anon", "authenticated"
  with check (((status = 'new'::text) AND (assigned_studio_id IS NULL) AND (claimed_by IS NULL) AND (claimed_at IS NULL) AND (converted_invitation_id IS NULL)));

create policy "invitation_requests_sales_operator_delete" on "public"."invitation_requests"
  for delete
  to "authenticated"
  using (public.is_invitta_sales_operator());

create policy "invitation_requests_sales_operator_select" on "public"."invitation_requests"
  for select
  to "authenticated"
  using (public.is_invitta_sales_operator());

create policy "invitation_requests_sales_operator_update" on "public"."invitation_requests"
  for update
  to "authenticated"
  using (public.is_invitta_sales_operator())
  with check (public.is_invitta_sales_operator());

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."invitation_requests" to "anon", "authenticated", "postgres", "service_role";
