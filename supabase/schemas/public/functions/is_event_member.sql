create or replace function public.is_event_member (
  target_evento_id uuid
)
  returns boolean
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
    select exists (
        select 1
        from public.eventos e
        join public.cliente_usuarios cu on cu.cliente_id = e.cliente_id
        where e.id = target_evento_id
          and cu.user_id = auth.uid()
    )
    or exists (
        select 1
        from public.evento_usuarios eu
        where eu.evento_id = target_evento_id
          and eu.user_id = auth.uid()
    );
$function$;

grant execute on function "public"."is_event_member"(uuid) to public, "anon", "authenticated", "postgres", "service_role";
