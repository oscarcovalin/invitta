-- Connect Studio invitations with the existing guest and RSVP dashboard.

alter table public.clientes
    add column if not exists studio_id uuid references public.studios(id) on delete set null;

create unique index if not exists clientes_studio_id_unique_idx
    on public.clientes(studio_id)
    where studio_id is not null;

alter table public.studio_invitations
    add column if not exists evento_id uuid references public.eventos(id) on delete set null;

create unique index if not exists studio_invitations_evento_id_unique_idx
    on public.studio_invitations(evento_id)
    where evento_id is not null;

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
      and user_id = auth.uid();

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

create or replace function public.get_public_invitation_guest(
    invitation_slug text,
    guest_token text
)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
    select jsonb_build_object(
        'id', g.id,
        'name', g.nombre,
        'family', g.familia,
        'passes', g.pases_asignados,
        'confirmedPasses', g.pases_confirmados,
        'table', g.mesa,
        'status', g.estado
    )
    from public.studio_invitations si
    join public.invitados g on g.evento_id = si.evento_id
    where si.slug = invitation_slug
      and si.published = true
      and g.qr_token = guest_token
    limit 1;
$$;

create or replace function public.submit_public_invitation_rsvp(
    invitation_slug text,
    guest_token text,
    attending boolean,
    confirmed_passes integer,
    guest_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    guest_row public.invitados%rowtype;
    safe_passes integer;
    new_status text;
begin
    select g.* into guest_row
    from public.studio_invitations si
    join public.invitados g on g.evento_id = si.evento_id
    where si.slug = invitation_slug
      and si.published = true
      and g.qr_token = guest_token
    limit 1;

    if guest_row.id is null then
        raise exception 'Invalid invitation guest';
    end if;

    safe_passes := case
        when attending and guest_row.pases_asignados > 0
            then greatest(1, least(coalesce(confirmed_passes, 1), guest_row.pases_asignados))
        else 0
    end;
    new_status := case when attending then 'Confirmado' else 'No asistira' end;

    update public.invitados set
        pases_confirmados = safe_passes,
        estado = new_status,
        confirmed_at = now(),
        updated_at = now()
    where id = guest_row.id;

    insert into public.confirmaciones (
        evento_id,
        invitado_id,
        asiste,
        pases_confirmados,
        mensaje,
        origen
    ) values (
        guest_row.evento_id,
        guest_row.id,
        attending,
        safe_passes,
        nullif(left(coalesce(guest_message, ''), 1000), ''),
        'invitacion'
    );

    return jsonb_build_object(
        'ok', true,
        'status', new_status,
        'confirmedPasses', safe_passes
    );
end;
$$;

revoke all on function public.sync_studio_invitation_event(uuid) from public;
grant execute on function public.sync_studio_invitation_event(uuid) to authenticated;

revoke all on function public.get_public_invitation_guest(text, text) from public;
grant execute on function public.get_public_invitation_guest(text, text) to anon, authenticated;

revoke all on function public.submit_public_invitation_rsvp(text, text, boolean, integer, text) from public;
grant execute on function public.submit_public_invitation_rsvp(text, text, boolean, integer, text) to anon, authenticated;
