-- Operational hardening for Studio roles, public invitation lifecycle and sales leads.

-- Editors can work on invitation content, but only managers can delete, publish,
-- change the package, or bind an invitation to an event dashboard.
drop policy if exists "studio_invitations_delete_members" on public.studio_invitations;
create policy "studio_invitations_delete_managers"
on public.studio_invitations for delete
to authenticated
using (public.is_invitta_studio_manager(studio_id));

create or replace function public.enforce_studio_invitation_manager_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        if new.published and not public.is_invitta_studio_manager(new.studio_id) then
            raise exception 'Only Studio managers can publish invitations';
        end if;
        return new;
    end if;

    if not public.is_invitta_studio_manager(new.studio_id)
       and (
           new.studio_id is distinct from old.studio_id
           or new.template_id is distinct from old.template_id
           or new.published is distinct from old.published
           or new.published_at is distinct from old.published_at
           or new.expires_at is distinct from old.expires_at
           or new.evento_id is distinct from old.evento_id
       ) then
        raise exception 'Only Studio managers can change publication, package, or event access';
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_studio_invitation_manager_fields_trigger on public.studio_invitations;
create trigger enforce_studio_invitation_manager_fields_trigger
before insert or update on public.studio_invitations
for each row execute function public.enforce_studio_invitation_manager_fields();

-- Use a stable Studio context instead of choosing an arbitrary membership.
create or replace function public.list_invitta_studios()
returns table (studio_id uuid, studio_name text, studio_role text)
language sql
stable
security definer
set search_path = public
as $$
    select s.id, s.name, sm.role
    from public.studios s
    join public.studio_members sm on sm.studio_id = s.id
    where sm.user_id = auth.uid()
    order by case sm.role when 'owner' then 0 when 'manager' then 1 else 2 end, s.created_at, s.id;
$$;

revoke all on function public.list_invitta_studios() from public;
grant execute on function public.list_invitta_studios() to authenticated;

-- Only owners and managers can create or administer the linked guest dashboard.
create or replace function public.sync_studio_invitation_event(target_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    invitation_row public.studio_invitations%rowtype;
    studio_row public.studios%rowtype;
    caller_studio_role text;
    target_cliente_id uuid;
    target_evento_id uuid;
    existing_event_cliente_id uuid;
    normalized_type text;
    normalized_date timestamptz;
    target_event_role text;
begin
    select * into invitation_row
    from public.studio_invitations
    where id = target_invitation_id;

    if invitation_row.id is null then
        raise exception 'Invitation not found';
    end if;

    select sm.role into caller_studio_role
    from public.studio_members sm
    where sm.studio_id = invitation_row.studio_id
      and sm.user_id = auth.uid();

    if caller_studio_role not in ('owner', 'manager') then
        raise exception 'Only Studio managers can prepare the guest dashboard';
    end if;

    select * into studio_row
    from public.studios
    where id = invitation_row.studio_id;

    target_event_role := case when caller_studio_role = 'owner' then 'owner' else 'admin' end;

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
    values (target_cliente_id, auth.uid(), target_event_role)
    on conflict (cliente_id, user_id) do update
    set rol = case
        when public.cliente_usuarios.rol = 'owner' then 'owner'
        else excluded.rol
    end;

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
                cliente_id, nombre, tipo, slug, fecha_evento, ubicacion, config, estado
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

-- Repair elevated legacy memberships created by the previous synchronization.
delete from public.cliente_usuarios cu
using public.clientes c, public.studio_members sm
where cu.cliente_id = c.id
  and c.studio_id = sm.studio_id
  and cu.user_id = sm.user_id
  and sm.role = 'editor';

update public.cliente_usuarios cu
set rol = 'admin'
from public.clientes c, public.studio_members sm
where cu.cliente_id = c.id
  and c.studio_id = sm.studio_id
  and cu.user_id = sm.user_id
  and sm.role = 'manager'
  and cu.rol = 'owner';

-- Anonymous requests must only expose invitations that are still active.
drop policy if exists "studio_invitations_anon_active_only" on public.studio_invitations;
create policy "studio_invitations_anon_active_only"
on public.studio_invitations as restrictive for select
to anon
using (published is true and (expires_at is null or expires_at > now()));

create or replace function public.get_public_invitation_guest(invitation_slug text, guest_token text)
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
      and si.published is true
      and (si.expires_at is null or si.expires_at > now())
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
      and si.published is true
      and (si.expires_at is null or si.expires_at > now())
      and g.qr_token = guest_token
    limit 1;

    if guest_row.id is null then
        raise exception 'Invalid or expired invitation guest';
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
        evento_id, invitado_id, asiste, pases_confirmados, mensaje, origen
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

-- Replace anonymous table inserts with a validated, throttled public RPC.
drop policy if exists "invitation_requests_public_insert" on public.invitation_requests;

create or replace function public.submit_public_invitation_request(request_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    request_id uuid;
    client_name_value text := left(trim(coalesce(request_payload ->> 'client_name', '')), 160);
    client_phone_value text := left(trim(coalesce(request_payload ->> 'client_phone', '')), 50);
    phone_digits text;
    event_type_value text := lower(left(trim(coalesce(request_payload ->> 'event_type', 'otro')), 30));
    package_tier_value text := lower(left(trim(coalesce(request_payload ->> 'package_tier', 'undecided')), 30));
    source_value text := lower(left(trim(coalesce(request_payload ->> 'source', 'landing')), 30));
begin
    if jsonb_typeof(request_payload) <> 'object' then
        raise exception 'Invalid request payload';
    end if;

    phone_digits := regexp_replace(client_phone_value, '[^0-9]', '', 'g');

    if char_length(client_name_value) < 2 or char_length(phone_digits) < 8 then
        raise exception 'Nombre y WhatsApp válidos son obligatorios';
    end if;

    if event_type_value not in ('xv', 'boda', 'bautizo', 'cumpleanos', 'otro') then
        event_type_value := 'otro';
    end if;
    if package_tier_value not in ('essential', 'premium', 'vip', 'undecided') then
        package_tier_value := 'undecided';
    end if;
    if source_value not in ('landing', 'catalog') then
        source_value := 'landing';
    end if;

    if exists (
        select 1
        from public.invitation_requests ir
        where regexp_replace(ir.client_phone, '[^0-9]', '', 'g') = phone_digits
          and ir.created_at > now() - interval '10 minutes'
    ) then
        raise exception 'Ya recibimos una solicitud reciente de este WhatsApp. Intenta de nuevo en unos minutos.';
    end if;

    insert into public.invitation_requests (
        client_name, client_phone, event_type, design_name, requested_template_id,
        package_tier, palette_preference, typography_preference, event_date,
        event_city, notes, source
    ) values (
        client_name_value,
        client_phone_value,
        event_type_value,
        nullif(left(trim(coalesce(request_payload ->> 'design_name', '')), 120), ''),
        nullif(left(trim(coalesce(request_payload ->> 'requested_template_id', '')), 120), ''),
        package_tier_value,
        nullif(left(trim(coalesce(request_payload ->> 'palette_preference', '')), 120), ''),
        nullif(left(trim(coalesce(request_payload ->> 'typography_preference', '')), 120), ''),
        nullif(request_payload ->> 'event_date', '')::date,
        nullif(left(trim(coalesce(request_payload ->> 'event_city', '')), 160), ''),
        nullif(left(trim(coalesce(request_payload ->> 'notes', '')), 2000), ''),
        source_value
    ) returning id into request_id;

    return request_id;
end;
$$;

revoke all on function public.submit_public_invitation_request(jsonb) from public;
grant execute on function public.submit_public_invitation_request(jsonb) to anon, authenticated;

