create or replace function public.current_user_dashboard_events()
  returns table (
    evento_id uuid,
    rol       text
  )
  language sql
  stable
  security definer
  set search_path to 'public'
  AS $function$
    select access.evento_id, access.rol
    from (
        select eu.evento_id, eu.rol, 0 as source_priority
        from public.evento_usuarios eu
        where eu.user_id = auth.uid()

        union all

        select e.id as evento_id, cu.rol, 1 as source_priority
        from public.eventos e
        join public.cliente_usuarios cu on cu.cliente_id = e.cliente_id
        where cu.user_id = auth.uid()
    ) access
    join public.eventos e on e.id = access.evento_id
    where e.estado <> 'archivado'
    order by
        case access.rol
            when 'owner' then 0
            when 'admin' then 1
            when 'staff' then 2
            else 3
        end,
        access.source_priority,
        e.fecha_evento nulls last,
        e.created_at;
$function$;

grant execute on function "public"."current_user_dashboard_events"() to "authenticated", "postgres", "service_role";

revoke all on function "public"."current_user_dashboard_events"() from public;
