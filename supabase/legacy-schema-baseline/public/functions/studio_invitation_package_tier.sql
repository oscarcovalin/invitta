create or replace function public.studio_invitation_package_tier (
  template_id text
)
  returns text
  language sql
  immutable
  AS $function$
    select case
        when coalesce(template_id, '') like '%-vip' then 'vip'
        when coalesce(template_id, '') like '%-premium' then 'premium'
        else 'essential'
    end;
$function$;

grant execute on function "public"."studio_invitation_package_tier"(text) to public, "anon", "authenticated", "postgres", "service_role";
