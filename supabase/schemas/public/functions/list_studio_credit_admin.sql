create or replace function public.list_studio_credit_admin()
  returns table (
    id                uuid,
    name              text,
    plan_tier         text,
    available_credits integer,
    used_credits      integer,
    created_at        timestamp with time zone
  )
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHENTICATED'
      USING ERRCODE = '42501',
            DETAIL = 'Debes iniciar sesión para consultar este listado.';
  END IF;

  IF NOT public.is_invitta_sales_operator() THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHORIZED_OPERATOR'
      USING ERRCODE = '42501',
            DETAIL = 'Acceso denegado al listado de administración de estudios.';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.plan_tier,
    s.available_credits,
    s.used_credits,
    s.created_at
  FROM public.studios s
  ORDER BY s.created_at DESC;
END;
$function$;

grant execute on function "public"."list_studio_credit_admin"() to "authenticated", "postgres", "service_role";

revoke all on function "public"."list_studio_credit_admin"() from public;
