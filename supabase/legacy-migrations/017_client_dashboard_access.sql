-- Give each event owner an isolated dashboard membership and track delivery
-- of the client access email from Invitta Studio.

alter table public.studio_invitations
    add column if not exists client_dashboard_email text,
    add column if not exists client_dashboard_user_id uuid references auth.users(id) on delete set null,
    add column if not exists client_dashboard_enabled boolean not null default false,
    add column if not exists client_dashboard_last_sent_at timestamptz;

create table if not exists public.evento_usuarios (
    evento_id uuid not null references public.eventos(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    rol text not null default 'cliente'
        check (rol in ('owner', 'admin', 'staff', 'cliente')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (evento_id, user_id)
);

create index if not exists evento_usuarios_user_id_idx
    on public.evento_usuarios(user_id);

alter table public.evento_usuarios enable row level security;

drop policy if exists "evento_usuarios_select_own" on public.evento_usuarios;
create policy "evento_usuarios_select_own"
on public.evento_usuarios for select
using (user_id = auth.uid());

create or replace function public.is_event_member(target_evento_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.eventos e
        join public.cliente_usuarios cu on cu.cliente_id = e.cliente_id
        where e.id = target_evento_id
          and cu.user_id = auth.uid()
    )
    or exists (
        select 1
        from public.evento_usuarios eu
        where eu.evento_id = target_evento_id
          and eu.user_id = auth.uid()
    );
$$;

create or replace function public.current_user_event_role(target_evento_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
    select access.rol
    from (
        select eu.rol, 0 as source_priority
        from public.evento_usuarios eu
        where eu.evento_id = target_evento_id
          and eu.user_id = auth.uid()

        union all

        select cu.rol, 1 as source_priority
        from public.eventos e
        join public.cliente_usuarios cu on cu.cliente_id = e.cliente_id
        where e.id = target_evento_id
          and cu.user_id = auth.uid()
    ) access
    order by
        access.source_priority,
        case access.rol
            when 'owner' then 0
            when 'admin' then 1
            when 'staff' then 2
            else 3
        end
    limit 1;
$$;

create or replace function public.current_user_dashboard_events()
returns table (evento_id uuid, rol text)
language sql
security definer
set search_path = public
stable
as $$
    select access.evento_id, access.rol
    from (
        select eu.evento_id, eu.rol, 0 as source_priority
        from public.evento_usuarios eu
        where eu.user_id = auth.uid()

        union all

        select e.id as evento_id, cu.rol, 1 as source_priority
        from public.eventos e
        join public.cliente_usuarios cu on cu.cliente_id = e.cliente_id
        where cu.user_id = auth.uid()
    ) access
    join public.eventos e on e.id = access.evento_id
    where e.estado <> 'archivado'
    order by
        case access.rol
            when 'owner' then 0
            when 'admin' then 1
            when 'staff' then 2
            else 3
        end,
        access.source_priority,
        e.fecha_evento nulls last,
        e.created_at;
$$;

revoke all on function public.current_user_dashboard_events() from public;
grant execute on function public.current_user_dashboard_events() to authenticated;
grant select on public.evento_usuarios to authenticated;

drop policy if exists "eventos_select_direct_members" on public.eventos;
create policy "eventos_select_direct_members"
on public.eventos for select
using (
    exists (
        select 1
        from public.evento_usuarios eu
        where eu.evento_id = eventos.id
          and eu.user_id = auth.uid()
    )
);

comment on table public.evento_usuarios is
    'Event-scoped dashboard access. Keeps end clients isolated from other Studio events.';
