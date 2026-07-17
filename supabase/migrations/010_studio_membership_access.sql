-- Let the central Invitta team operate the same Studio without replacing the
-- original Studio account. Existing Studio owners remain owners.

create table if not exists public.studio_members (
    studio_id uuid not null references public.studios(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'editor' check (role in ('owner', 'manager', 'editor')),
    created_at timestamptz not null default now(),
    primary key (studio_id, user_id)
);

alter table public.studio_members enable row level security;

drop policy if exists "studio_members_select_own" on public.studio_members;
create policy "studio_members_select_own"
on public.studio_members for select
to authenticated
using (user_id = auth.uid());

-- Preserve access for every pre-existing Studio owner.
insert into public.studio_members (studio_id, user_id, role)
select id, user_id, 'owner'
from public.studios
where user_id is not null
on conflict (studio_id, user_id) do update
set role = excluded.role;

create or replace function public.is_invitta_studio_member(target_studio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.studio_members
        where studio_id = target_studio_id
          and user_id = auth.uid()
    );
$$;

revoke all on function public.is_invitta_studio_member(uuid) from public;
grant execute on function public.is_invitta_studio_member(uuid) to authenticated;

create or replace function public.is_invitta_studio_manager(target_studio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.studio_members
        where studio_id = target_studio_id
          and user_id = auth.uid()
          and role in ('owner', 'manager')
    );
$$;

revoke all on function public.is_invitta_studio_manager(uuid) from public;
grant execute on function public.is_invitta_studio_manager(uuid) to authenticated;

-- Replace the original one-user-only policies with membership-aware policies.
drop policy if exists "studios_select_own" on public.studios;
drop policy if exists "studios_update_own" on public.studios;
drop policy if exists "studios_delete_own" on public.studios;
create policy "studios_select_members"
on public.studios for select
to authenticated
using (public.is_invitta_studio_member(id));
create policy "studios_update_managers"
on public.studios for update
to authenticated
using (public.is_invitta_studio_manager(id))
with check (public.is_invitta_studio_manager(id));
create policy "studios_delete_managers"
on public.studios for delete
to authenticated
using (public.is_invitta_studio_manager(id));

drop policy if exists "studio_invitations_select_own" on public.studio_invitations;
drop policy if exists "studio_invitations_insert_own" on public.studio_invitations;
drop policy if exists "studio_invitations_update_own" on public.studio_invitations;
drop policy if exists "studio_invitations_delete_own" on public.studio_invitations;
create policy "studio_invitations_select_members"
on public.studio_invitations for select
to authenticated
using (public.is_invitta_studio_member(studio_id));
create policy "studio_invitations_insert_members"
on public.studio_invitations for insert
to authenticated
with check (public.is_invitta_studio_member(studio_id));
create policy "studio_invitations_update_members"
on public.studio_invitations for update
to authenticated
using (public.is_invitta_studio_member(studio_id))
with check (public.is_invitta_studio_member(studio_id));
create policy "studio_invitations_delete_members"
on public.studio_invitations for delete
to authenticated
using (public.is_invitta_studio_member(studio_id));

create or replace function public.current_invitta_studio()
returns table (id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
    select s.id, s.name
    from public.studios s
    join public.studio_members sm on sm.studio_id = s.id
    where sm.user_id = auth.uid()
    order by case sm.role when 'owner' then 0 when 'manager' then 1 else 2 end, s.created_at
    limit 1;
$$;

revoke all on function public.current_invitta_studio() from public;
grant execute on function public.current_invitta_studio() to authenticated;

-- The platform owner can administer the existing central Studio alongside
-- its original account and can access the secure commercial request queue.
insert into public.studio_members (studio_id, user_id, role)
select '4cddeb0e-a42f-46a5-b312-3d0490b34435'::uuid, u.id, 'owner'
from auth.users u
where lower(u.email) = 'oscarcovalin@gmail.com'
on conflict (studio_id, user_id) do update
set role = excluded.role;

insert into public.invitta_sales_operators (user_id)
select id
from auth.users
where lower(email) = 'oscarcovalin@gmail.com'
on conflict (user_id) do nothing;

create or replace function public.sync_studio_invitation_event(target_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    invitation_row public.studio_invitations%rowtype;
    studio_row public.studios%rowtype;
    target_cliente_id uuid;
    target_evento_id uuid;
    existing_event_cliente_id uuid;
    normalized_type text;
    normalized_date timestamptz;
begin
    select * into invitation_row
    from public.studio_invitations
    where id = target_invitation_id;

    if invitation_row.id is null then
        raise exception 'Invitation not found';
    end if;

    select * into studio_row
    from public.studios
    where id = invitation_row.studio_id
      and public.is_invitta_studio_member(id);

    if studio_row.id is null then
        raise exception 'Not authorized for this invitation';
    end if;

    insert into public.clientes (nombre, email_contacto, plan, estado, studio_id)
    values (
        coalesce(nullif(trim(studio_row.name), ''), 'Invitta Studio'),
        (select email from auth.users where id = auth.uid()),
        'studio',
        'activo',
        studio_row.id
    )
    on conflict (studio_id) where studio_id is not null
    do update set
        nombre = excluded.nombre,
        email_contacto = excluded.email_contacto,
        updated_at = now()
    returning id into target_cliente_id;

    insert into public.cliente_usuarios (cliente_id, user_id, rol)
    values (target_cliente_id, auth.uid(), 'owner')
    on conflict (cliente_id, user_id) do update set rol = 'owner';

    normalized_type := case
        when lower(coalesce(invitation_row.event_type, '')) like '%xv%' then 'xv'
        when lower(coalesce(invitation_row.event_type, '')) like '%boda%' then 'boda'
        else 'otro'
    end;

    if invitation_row.event_date is not null then
        normalized_date := invitation_row.event_date::date::timestamptz;
    end if;

    target_evento_id := invitation_row.evento_id;

    if target_evento_id is null then
        select id, cliente_id into target_evento_id, existing_event_cliente_id
        from public.eventos
        where slug = invitation_row.slug;

        if target_evento_id is not null and existing_event_cliente_id <> target_cliente_id then
            raise exception 'The invitation slug is already linked to another account';
        end if;

        if target_evento_id is null then
            insert into public.eventos (
                cliente_id,
                nombre,
                tipo,
                slug,
                fecha_evento,
                ubicacion,
                config,
                estado
            ) values (
                target_cliente_id,
                coalesce(nullif(trim(invitation_row.title), ''), nullif(trim(invitation_row.honoree_name), ''), 'Evento'),
                normalized_type,
                invitation_row.slug,
                normalized_date,
                coalesce(nullif(trim(invitation_row.reception_address), ''), nullif(trim(invitation_row.ceremony_address), '')),
                jsonb_build_object(
                    'inviteUrl', '/invitacion.html?slug=' || invitation_row.slug,
                    'studioInvitationId', invitation_row.id
                ),
                case when invitation_row.published then 'activo' else 'borrador' end
            )
            returning id into target_evento_id;
        end if;
    else
        select cliente_id into existing_event_cliente_id
        from public.eventos
        where id = target_evento_id;

        if existing_event_cliente_id is null or existing_event_cliente_id <> target_cliente_id then
            raise exception 'The linked event does not belong to this studio';
        end if;
    end if;

    update public.eventos set
        cliente_id = target_cliente_id,
        nombre = coalesce(nullif(trim(invitation_row.title), ''), nullif(trim(invitation_row.honoree_name), ''), 'Evento'),
        tipo = normalized_type,
        slug = invitation_row.slug,
        fecha_evento = normalized_date,
        ubicacion = coalesce(nullif(trim(invitation_row.reception_address), ''), nullif(trim(invitation_row.ceremony_address), '')),
        config = public.eventos.config || jsonb_build_object(
            'inviteUrl', '/invitacion.html?slug=' || invitation_row.slug,
            'studioInvitationId', invitation_row.id
        ),
        estado = case when invitation_row.published then 'activo' else 'borrador' end,
        updated_at = now()
    where id = target_evento_id;

    update public.studio_invitations
    set evento_id = target_evento_id
    where id = invitation_row.id;

    return target_evento_id;
end;
$$;
