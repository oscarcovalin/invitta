create or replace function public.is_invitta_studio_member (
  target_studio_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
    select exists (
        select 1
        from public.studio_members
        where studio_id = target_studio_id
          and user_id = auth.uid()
    );
$function$;

grant execute on function "public"."is_invitta_studio_member"(uuid) to "anon", "authenticated", "postgres", "service_role";

revoke all on function "public"."is_invitta_studio_member"(uuid) from public;
