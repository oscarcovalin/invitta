-- Enable secure QR access control only for VIP Studio invitations.

-- Studio templates use stable public slugs (for example
-- xv-champagne-rose-vip). The original catalog used UUID references, but the
-- current editor and public renderer share these slugs directly.
alter table public.studio_invitations
    drop constraint if exists studio_invitations_template_id_fkey;

alter table public.studio_invitations
    alter column template_id type text using template_id::text;

create or replace function public.studio_invitation_package_tier(template_id text)
returns text
language sql
immutable
as $$
    select case
        when coalesce(template_id, '') like '%-vip' then 'vip'
        when coalesce(template_id, '') like '%-premium' then 'premium'
        else 'essential'
    end;
$$;

create or replace function public.sync_studio_invitation_access_config()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    package_tier text;
begin
    if new.evento_id is null then
        return new;
    end if;

    package_tier := public.studio_invitation_package_tier(new.template_id);

    update public.eventos
    set config = coalesce(config, '{}'::jsonb) || jsonb_build_object(
        'templateId', new.template_id,
        'packageTier', package_tier,
        'qrAccessEnabled', package_tier = 'vip'
    )
    where id = new.evento_id;

    return new;
end;
$$;

drop trigger if exists sync_studio_invitation_access_config_trigger
    on public.studio_invitations;

create trigger sync_studio_invitation_access_config_trigger
after insert or update of template_id, evento_id
on public.studio_invitations
for each row execute function public.sync_studio_invitation_access_config();

update public.eventos e
set config = coalesce(e.config, '{}'::jsonb) || jsonb_build_object(
    'templateId', si.template_id,
    'packageTier', public.studio_invitation_package_tier(si.template_id),
    'qrAccessEnabled', public.studio_invitation_package_tier(si.template_id) = 'vip'
)
from public.studio_invitations si
where si.evento_id = e.id;

create or replace function public.check_in_vip_guest(
    target_guest_id uuid,
    scanned_token text default null,
    checkin_method text default 'qr'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    guest_row public.invitados%rowtype;
    event_config jsonb;
    user_role text;
    access_status text;
    used_passes integer;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    select * into guest_row
    from public.invitados
    where id = target_guest_id
    for update;

    if guest_row.id is null then
        return jsonb_build_object('ok', false, 'code', 'not_found');
    end if;

    user_role := public.current_user_event_role(guest_row.evento_id);
    if user_role not in ('owner', 'admin', 'staff') then
        raise exception 'Not authorized for this event';
    end if;

    select coalesce(config, '{}'::jsonb) into event_config
    from public.eventos
    where id = guest_row.evento_id;

    if coalesce((event_config ->> 'qrAccessEnabled')::boolean, false) is not true then
        return jsonb_build_object('ok', false, 'code', 'vip_required');
    end if;

    if checkin_method = 'qr'
       and (nullif(trim(coalesce(scanned_token, '')), '') is null
            or guest_row.qr_token <> scanned_token) then
        return jsonb_build_object('ok', false, 'code', 'invalid_token');
    end if;

    used_passes := greatest(1, coalesce(nullif(guest_row.pases_confirmados, 0), guest_row.pases_asignados, 1));

    if guest_row.qr_status = 'cancelled' then
        access_status := 'rechazado';
    elsif guest_row.checked_in is true or guest_row.qr_status = 'used' then
        access_status := 'duplicado';
    elsif lower(coalesce(guest_row.estado, '')) not like 'confirmad%' then
        access_status := 'rechazado';
    else
        access_status := case when checkin_method = 'manual' then 'manual' else 'validado' end;
    end if;

    insert into public.accesos (
        evento_id,
        invitado_id,
        qr_token,
        pases_usados,
        status,
        checked_in_by
    ) values (
        guest_row.evento_id,
        guest_row.id,
        guest_row.qr_token,
        used_passes,
        access_status,
        auth.uid()
    );

    if access_status = 'duplicado' then
        return jsonb_build_object('ok', false, 'code', 'duplicate');
    end if;

    if guest_row.qr_status = 'cancelled' then
        return jsonb_build_object('ok', false, 'code', 'cancelled');
    end if;

    if lower(coalesce(guest_row.estado, '')) not like 'confirmad%' then
        return jsonb_build_object('ok', false, 'code', 'not_confirmed');
    end if;

    update public.invitados
    set checked_in = true,
        checked_in_at = now(),
        checked_in_by = auth.uid(),
        qr_status = 'used'
    where id = guest_row.id;

    return jsonb_build_object(
        'ok', true,
        'code', 'checked_in',
        'guestId', guest_row.id,
        'eventId', guest_row.evento_id,
        'passes', used_passes
    );
end;
$$;

revoke all on function public.check_in_vip_guest(uuid, text, text) from public;
grant execute on function public.check_in_vip_guest(uuid, text, text) to authenticated;
