create or replace function public.is_invitta_sales_operator()
  returns boolean
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
    select exists (
        select 1
        from public.invitta_sales_operators
        where user_id = auth.uid()
    );
$function$;

grant execute on function "public"."is_invitta_sales_operator"() to "anon", "authenticated", "postgres", "service_role";

revoke all on function "public"."is_invitta_sales_operator"() from public;
