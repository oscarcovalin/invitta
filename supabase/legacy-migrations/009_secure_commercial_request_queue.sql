-- Commercial leads contain private contact information. Only the central
-- Invitta sales team may access the unassigned queue.

create table if not exists public.invitta_sales_operators (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.invitta_sales_operators enable row level security;
revoke all on table public.invitta_sales_operators from anon, authenticated;

insert into public.invitta_sales_operators (user_id)
select id
from auth.users
where email = 'info_xvteens@gmail.com'
on conflict (user_id) do nothing;

create or replace function public.is_invitta_sales_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.invitta_sales_operators
        where user_id = auth.uid()
    );
$$;

revoke all on function public.is_invitta_sales_operator() from public;
grant execute on function public.is_invitta_sales_operator() to authenticated;

drop policy if exists "invitation_requests_studio_select" on public.invitation_requests;
drop policy if exists "invitation_requests_studio_claim_or_update" on public.invitation_requests;

create policy "invitation_requests_sales_operator_select"
on public.invitation_requests for select
to authenticated
using (public.is_invitta_sales_operator());

create policy "invitation_requests_sales_operator_update"
on public.invitation_requests for update
to authenticated
using (public.is_invitta_sales_operator())
with check (public.is_invitta_sales_operator());

drop function if exists public.owns_invitta_studio(uuid);
