create or replace function public.check_in_vip_guest (
  target_guest_id uuid,
  scanned_token   text default null::text,
  checkin_method  text default 'qr'::text
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
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
$function$;

grant execute on function "public"."check_in_vip_guest"(uuid, text, text) to "authenticated", "postgres", "service_role";

revoke all on function "public"."check_in_vip_guest"(uuid, text, text) from public;
