create or replace function public.sync_studio_invitation_access_config()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
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
$function$;

grant execute on function "public"."sync_studio_invitation_access_config"() to "postgres", "service_role";

revoke all on function "public"."sync_studio_invitation_access_config"() from public;
