create or replace function public.submit_public_invitation_rsvp (
  invitation_slug  text,
  guest_token      text,
  attending        boolean,
  confirmed_passes integer,
  guest_message    text    default null::text
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
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
$function$;

grant execute on function "public"."submit_public_invitation_rsvp"(text, text, boolean, integer, text) to "anon", "authenticated", "postgres", "service_role";

revoke all on function "public"."submit_public_invitation_rsvp"(text, text, boolean, integer, text) from public;
