create or replace function public.sync_studio_invitation_event (
  target_invitation_id uuid
)
  returns uuid
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
DECLARE
  v_res jsonb;
BEGIN
  v_res := public.activate_studio_invitation_qr(target_invitation_id);
  RETURN (v_res->>'evento_id')::uuid;
END;
$function$;

grant execute on function "public"."sync_studio_invitation_event"(uuid) to "authenticated", "postgres", "service_role";

revoke all on function "public"."sync_studio_invitation_event"(uuid) from public;
