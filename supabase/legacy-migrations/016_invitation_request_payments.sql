-- Payment status for commercial requests. Values are written only by the
-- Stripe webhook through the Supabase service role.

alter table public.invitation_requests
    add column if not exists payment_status text not null default 'not_started'
        check (payment_status in ('not_started', 'pending', 'paid', 'failed', 'expired')),
    add column if not exists stripe_session_id text,
    add column if not exists payment_method text
        check (payment_method is null or payment_method in ('card', 'oxxo')),
    add column if not exists payment_amount_mxn integer
        check (payment_amount_mxn is null or payment_amount_mxn > 0),
    add column if not exists payment_email text,
    add column if not exists paid_at timestamptz;

create unique index if not exists invitation_requests_stripe_session_idx
    on public.invitation_requests(stripe_session_id)
    where stripe_session_id is not null;

create index if not exists invitation_requests_payment_status_idx
    on public.invitation_requests(payment_status, created_at desc);
