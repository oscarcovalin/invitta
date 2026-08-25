create or replace function public.set_studio_invitation_lifecycle()
  returns trigger
  language plpgsql
  set search_path to 'public'
  AS $function$
declare
    should_start_new_period boolean;
    template_changed boolean := false;
begin
    if new.published is not true then
        return new;
    end if;

    if tg_op = 'INSERT' then
        should_start_new_period := true;
    else
        should_start_new_period := old.published is distinct from true
            or new.published_at is null;
        template_changed := new.template_id is distinct from old.template_id;
    end if;

    if should_start_new_period then
        new.published_at := now();
    end if;

    if should_start_new_period
       or template_changed
       or new.expires_at is null then
        new.expires_at := new.published_at
            + make_interval(months => public.studio_invitation_active_months(new.template_id));
    end if;

    return new;
end;
$function$;

grant execute on function "public"."set_studio_invitation_lifecycle"() to public, "anon", "authenticated", "postgres", "service_role";
