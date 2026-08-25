create or replace function public.is_cliente_member (
  target_cliente_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
    select exists (
        select 1
        from public.cliente_usuarios cu
        where cu.cliente_id = target_cliente_id
          and cu.user_id = auth.uid()
    );
$function$;

grant execute on function "public"."is_cliente_member"(uuid) to public, "anon", "authenticated", "postgres", "service_role";
