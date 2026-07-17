-- Let each Studio see unassigned leads and the leads it has already claimed.
-- A lead becomes private to the Studio that claims it, unless an Invitta sales
-- operator needs to supervise the commercial queue.

create or replace function public.owns_invitta_studio(target_studio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.studios
        where id = target_studio_id
          and user_id = auth.uid()
    );
$$;

alter table public.invitation_requests enable row level security;

drop policy if exists "invitation_requests_sales_operator_select" on public.invitation_requests;
create policy "invitation_requests_studio_select"
on public.invitation_requests for select
to authenticated
using (
    public.is_invitta_sales_operator()
    or assigned_studio_id is null
    or public.owns_invitta_studio(assigned_studio_id)
);

drop policy if exists "invitation_requests_sales_operator_update" on public.invitation_requests;
create policy "invitation_requests_studio_claim_or_update"
on public.invitation_requests for update
to authenticated
using (
    public.is_invitta_sales_operator()
    or assigned_studio_id is null
    or public.owns_invitta_studio(assigned_studio_id)
)
with check (
    public.is_invitta_sales_operator()
    or (
        assigned_studio_id is not null
        and public.owns_invitta_studio(assigned_studio_id)
    )
);
