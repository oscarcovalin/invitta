-- Invittia SaaS - Fase 1
-- Supabase/Postgres schema for clientes, eventos, invitados,
-- confirmaciones and accesos.

create extension if not exists pgcrypto;

create table if not exists public.clientes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    email_contacto text,
    telefono text,
    plan text not null default 'demo',
    estado text not null default 'activo' check (estado in ('activo', 'pausado', 'cancelado')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.cliente_usuarios (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.clientes(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    rol text not null default 'cliente' check (rol in ('owner', 'admin', 'staff', 'cliente')),
    created_at timestamptz not null default now(),
    unique (cliente_id, user_id)
);

create table if not exists public.eventos (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.clientes(id) on delete cascade,
    nombre text not null,
    tipo text not null default 'boda' check (tipo in ('boda', 'xv', 'bautizo', 'cumpleanos', 'corporativo', 'otro')),
    slug text not null unique,
    fecha_evento timestamptz,
    ubicacion text,
    config jsonb not null default '{}'::jsonb,
    theme jsonb not null default '{}'::jsonb,
    estado text not null default 'activo' check (estado in ('borrador', 'activo', 'archivado')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.invitados (
    id uuid primary key default gen_random_uuid(),
    evento_id uuid not null references public.eventos(id) on delete cascade,
    nombre text not null,
    familia text,
    email text,
    telefono text,
    mesa text,
    pases_asignados integer not null default 1 check (pases_asignados >= 0),
    pases_confirmados integer not null default 0 check (pases_confirmados >= 0),
    estado text not null default 'Pendiente' check (estado in ('Confirmado', 'Pendiente', 'No asistira', 'No asistirá')),
    qr_token text not null unique default encode(gen_random_bytes(18), 'hex'),
    notas text,
    confirmed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.confirmaciones (
    id uuid primary key default gen_random_uuid(),
    evento_id uuid not null references public.eventos(id) on delete cascade,
    invitado_id uuid not null references public.invitados(id) on delete cascade,
    asiste boolean not null,
    pases_confirmados integer not null default 0 check (pases_confirmados >= 0),
    mensaje text,
    origen text not null default 'dashboard' check (origen in ('dashboard', 'invitacion', 'whatsapp', 'manual')),
    confirmed_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create table if not exists public.accesos (
    id uuid primary key default gen_random_uuid(),
    evento_id uuid not null references public.eventos(id) on delete cascade,
    invitado_id uuid not null references public.invitados(id) on delete cascade,
    qr_token text not null,
    pases_usados integer not null default 1 check (pases_usados > 0),
    status text not null default 'validado' check (status in ('validado', 'duplicado', 'rechazado', 'manual')),
    checked_in_by uuid references auth.users(id) on delete set null,
    checked_in_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_cliente_usuarios_user_id on public.cliente_usuarios(user_id);
create index if not exists idx_eventos_cliente_id on public.eventos(cliente_id);
create index if not exists idx_eventos_slug on public.eventos(slug);
create index if not exists idx_invitados_evento_id on public.invitados(evento_id);
create index if not exists idx_invitados_qr_token on public.invitados(qr_token);
create index if not exists idx_confirmaciones_evento_id on public.confirmaciones(evento_id);
create index if not exists idx_confirmaciones_invitado_id on public.confirmaciones(invitado_id);
create index if not exists idx_accesos_evento_id on public.accesos(evento_id);
create index if not exists idx_accesos_invitado_id on public.accesos(invitado_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_clientes_updated_at on public.clientes;
create trigger set_clientes_updated_at
before update on public.clientes
for each row execute function public.set_updated_at();

drop trigger if exists set_eventos_updated_at on public.eventos;
create trigger set_eventos_updated_at
before update on public.eventos
for each row execute function public.set_updated_at();

drop trigger if exists set_invitados_updated_at on public.invitados;
create trigger set_invitados_updated_at
before update on public.invitados
for each row execute function public.set_updated_at();

create or replace function public.is_cliente_member(target_cliente_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.cliente_usuarios cu
        where cu.cliente_id = target_cliente_id
          and cu.user_id = auth.uid()
    );
$$;

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
    );
$$;

create or replace function public.current_user_event_role(target_evento_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
    select cu.rol
    from public.eventos e
    join public.cliente_usuarios cu on cu.cliente_id = e.cliente_id
    where e.id = target_evento_id
      and cu.user_id = auth.uid()
    limit 1;
$$;

alter table public.clientes enable row level security;
alter table public.cliente_usuarios enable row level security;
alter table public.eventos enable row level security;
alter table public.invitados enable row level security;
alter table public.confirmaciones enable row level security;
alter table public.accesos enable row level security;

drop policy if exists "clientes_select_members" on public.clientes;
create policy "clientes_select_members"
on public.clientes for select
using (public.is_cliente_member(id));

drop policy if exists "clientes_update_admins" on public.clientes;
create policy "clientes_update_admins"
on public.clientes for update
using (
    exists (
        select 1 from public.cliente_usuarios cu
        where cu.cliente_id = clientes.id
          and cu.user_id = auth.uid()
          and cu.rol in ('owner', 'admin')
    )
)
with check (
    exists (
        select 1 from public.cliente_usuarios cu
        where cu.cliente_id = clientes.id
          and cu.user_id = auth.uid()
          and cu.rol in ('owner', 'admin')
    )
);

drop policy if exists "cliente_usuarios_select_own_clients" on public.cliente_usuarios;
create policy "cliente_usuarios_select_own_clients"
on public.cliente_usuarios for select
using (user_id = auth.uid() or public.is_cliente_member(cliente_id));

drop policy if exists "eventos_select_members" on public.eventos;
create policy "eventos_select_members"
on public.eventos for select
using (public.is_cliente_member(cliente_id));

drop policy if exists "eventos_insert_admins" on public.eventos;
create policy "eventos_insert_admins"
on public.eventos for insert
with check (
    exists (
        select 1 from public.cliente_usuarios cu
        where cu.cliente_id = eventos.cliente_id
          and cu.user_id = auth.uid()
          and cu.rol in ('owner', 'admin')
    )
);

drop policy if exists "eventos_update_admins" on public.eventos;
create policy "eventos_update_admins"
on public.eventos for update
using (
    exists (
        select 1 from public.cliente_usuarios cu
        where cu.cliente_id = eventos.cliente_id
          and cu.user_id = auth.uid()
          and cu.rol in ('owner', 'admin')
    )
)
with check (
    exists (
        select 1 from public.cliente_usuarios cu
        where cu.cliente_id = eventos.cliente_id
          and cu.user_id = auth.uid()
          and cu.rol in ('owner', 'admin')
    )
);

drop policy if exists "invitados_select_event_members" on public.invitados;
create policy "invitados_select_event_members"
on public.invitados for select
using (public.is_event_member(evento_id));

drop policy if exists "invitados_insert_event_admins" on public.invitados;
create policy "invitados_insert_event_admins"
on public.invitados for insert
with check (public.current_user_event_role(evento_id) in ('owner', 'admin'));

drop policy if exists "invitados_update_event_admins" on public.invitados;
create policy "invitados_update_event_admins"
on public.invitados for update
using (public.current_user_event_role(evento_id) in ('owner', 'admin'))
with check (public.current_user_event_role(evento_id) in ('owner', 'admin'));

drop policy if exists "invitados_delete_event_admins" on public.invitados;
create policy "invitados_delete_event_admins"
on public.invitados for delete
using (public.current_user_event_role(evento_id) in ('owner', 'admin'));

drop policy if exists "confirmaciones_select_event_members" on public.confirmaciones;
create policy "confirmaciones_select_event_members"
on public.confirmaciones for select
using (public.is_event_member(evento_id));

drop policy if exists "confirmaciones_insert_event_admins" on public.confirmaciones;
create policy "confirmaciones_insert_event_admins"
on public.confirmaciones for insert
with check (public.current_user_event_role(evento_id) in ('owner', 'admin', 'staff', 'cliente'));

drop policy if exists "accesos_select_event_members" on public.accesos;
create policy "accesos_select_event_members"
on public.accesos for select
using (public.is_event_member(evento_id));

drop policy if exists "accesos_insert_event_staff" on public.accesos;
create policy "accesos_insert_event_staff"
on public.accesos for insert
with check (
    public.current_user_event_role(evento_id) in ('owner', 'admin', 'staff')
    and checked_in_by = auth.uid()
);

