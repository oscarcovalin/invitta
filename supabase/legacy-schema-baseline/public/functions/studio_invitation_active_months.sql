create or replace function public.studio_invitation_active_months (
  template_id text
)
  returns integer
  language sql
  immutable
  AS $function$
    select case public.studio_invitation_package_tier(template_id)
        when 'vip' then 12
        when 'premium' then 4
        else 2
    end;
$function$;

grant execute on function "public"."studio_invitation_active_months"(text) to public, "anon", "authenticated", "postgres", "service_role";
