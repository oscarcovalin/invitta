-- Public sales requests for Invitta's commercial flow.
-- This table accepts public leads but only authenticated sales operators can read them.

create table if not exists public.invitation_requests (
    id uuid primary key default gen_random_uuid(),
    client_name text not null,
    client_phone text not null,
    event_type text not null,
    design_name text,
    requested_template_id text,
    package_tier text not null default 'undecided'
        check (package_tier in ('essential', 'premium', 'vip', 'undecided')),
    palette_preference text,
    typography_preference text,
    event_date date,
    event_city text,
    notes text,
    source text not null default 'landing'
        check (source in ('landing', 'catalog', 'whatsapp', 'manual')),
    status text not null default 'new'
        check (status in ('new', 'contacted', 'in_progress', 'won', 'lost')),
    assigned_studio_id uuid references public.studios(id) on delete set null,
    claimed_by uuid references auth.users(id) on delete set null,
    claimed_at timestamptz,
    converted_invitation_id uuid references public.studio_invitations(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists invitation_requests_status_created_at_idx
    on public.invitation_requests(status, created_at desc);

create index if not exists invitation_requests_assigned_studio_idx
    on public.invitation_requests(assigned_studio_id);

drop trigger if exists set_invitation_requests_updated_at on public.invitation_requests;
create trigger set_invitation_requests_updated_at
before update on public.invitation_requests
for each row execute function public.set_updated_at();

-- Grant this claim only to accounts deliberately marked in Supabase Auth app metadata:
-- { "invitta_sales_operator": true }
create or replace function public.is_invitta_sales_operator()
returns boolean
language sql
stable
as $$
    select coalesce(auth.jwt() -> 'app_metadata' ->> 'invitta_sales_operator', 'false') = 'true';
$$;

alter table public.invitation_requests enable row level security;

drop policy if exists "invitation_requests_public_insert" on public.invitation_requests;
create policy "invitation_requests_public_insert"
on public.invitation_requests for insert
to anon, authenticated
with check (
    status = 'new'
    and assigned_studio_id is null
    and claimed_by is null
    and claimed_at is null
    and converted_invitation_id is null
);

drop policy if exists "invitation_requests_sales_operator_select" on public.invitation_requests;
create policy "invitation_requests_sales_operator_select"
on public.invitation_requests for select
to authenticated
using (public.is_invitta_sales_operator());

drop policy if exists "invitation_requests_sales_operator_update" on public.invitation_requests;
create policy "invitation_requests_sales_operator_update"
on public.invitation_requests for update
to authenticated
using (public.is_invitta_sales_operator())
with check (public.is_invitta_sales_operator());

drop policy if exists "invitation_requests_sales_operator_delete" on public.invitation_requests;
create policy "invitation_requests_sales_operator_delete"
on public.invitation_requests for delete
to authenticated
using (public.is_invitta_sales_operator());
