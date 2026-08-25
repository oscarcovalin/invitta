create or replace function public.current_invitta_studio()
  returns table (
    id   uuid,
    name text
  )
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
    select s.id, s.name
    from public.studios s
    join public.studio_members sm on sm.studio_id = s.id
    where sm.user_id = auth.uid()
    order by case sm.role when 'owner' then 0 when 'manager' then 1 else 2 end, s.created_at
    limit 1;
$function$;

grant execute on function "public"."current_invitta_studio"() to "authenticated", "postgres", "service_role";

revoke all on function "public"."current_invitta_studio"() from public;
