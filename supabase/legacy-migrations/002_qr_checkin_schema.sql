-- Invittia Phase 3A: QR tokens and check-in audit schema.
-- This migration is additive and non-destructive.

create extension if not exists pgcrypto;

alter table public.invitados
    add column if not exists qr_token text,
    add column if not exists qr_status text not null default 'active',
    add column if not exists checked_in boolean not null default false,
    add column if not exists checked_in_at timestamptz,
    add column if not exists checked_in_by uuid references auth.users(id) on delete set null;

update public.invitados
set qr_token = gen_random_uuid()::text
where qr_token is null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'invitados_qr_status_check'
          and conrelid = 'public.invitados'::regclass
    ) then
        alter table public.invitados
            add constraint invitados_qr_status_check
            check (qr_status in ('active', 'used', 'cancelled'));
    end if;
end $$;

create unique index if not exists invitados_qr_token_unique_idx
    on public.invitados(qr_token)
    where qr_token is not null;

create index if not exists invitados_qr_token_idx
    on public.invitados(qr_token);

create table if not exists public.checkins (
    id uuid primary key default gen_random_uuid(),
    evento_id uuid not null references public.eventos(id) on delete cascade,
    invitado_id uuid references public.invitados(id) on delete set null,
    qr_token text,
    scanned_by uuid references auth.users(id) on delete set null,
    scanned_at timestamptz not null default now(),
    status text not null,
    notes text,
    created_at timestamptz not null default now()
);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'checkins_status_check'
          and conrelid = 'public.checkins'::regclass
    ) then
        alter table public.checkins
            add constraint checkins_status_check
            check (status in ('valid', 'duplicate', 'invalid', 'cancelled'));
    end if;
end $$;

create index if not exists checkins_evento_id_idx
    on public.checkins(evento_id);

create index if not exists checkins_invitado_id_idx
    on public.checkins(invitado_id);

create index if not exists checkins_qr_token_idx
    on public.checkins(qr_token);
