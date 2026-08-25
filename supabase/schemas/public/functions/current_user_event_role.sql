create or replace function public.current_user_event_role (
  target_evento_id uuid
)
  returns text
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
    select access.rol
    from (
        select eu.rol, 0 as source_priority
        from public.evento_usuarios eu
        where eu.evento_id = target_evento_id
          and eu.user_id = auth.uid()

        union all

        select cu.rol, 1 as source_priority
        from public.eventos e
        join public.cliente_usuarios cu on cu.cliente_id = e.cliente_id
        where e.id = target_evento_id
          and cu.user_id = auth.uid()
    ) access
    order by
        access.source_priority,
        case access.rol
            when 'owner' then 0
            when 'admin' then 1
            when 'staff' then 2
            else 3
        end
    limit 1;
$function$;

grant execute on function "public"."current_user_event_role"(uuid) to public, "anon", "authenticated", "postgres", "service_role";
