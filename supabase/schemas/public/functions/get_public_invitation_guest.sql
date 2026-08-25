create or replace function public.get_public_invitation_guest (
  invitation_slug text,
  guest_token     text
)
  returns jsonb
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
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
$function$;

grant execute on function "public"."get_public_invitation_guest"(text, text) to "anon", "authenticated", "postgres", "service_role";

revoke all on function "public"."get_public_invitation_guest"(text, text) from public;
