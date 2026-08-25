create or replace function public.list_studio_credit_ledger (
  target_studio_id uuid
)
  returns table (
    id               uuid,
    studio_id        uuid,
    actor_user_id    uuid,
    operator_user_id uuid,
    delta_credits    integer,
    balance_after    integer,
    transaction_type text,
    reason           text,
    note             text,
    created_at       timestamp with time zone
  )
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHENTICATED'
      USING ERRCODE = '42501',
            DETAIL = 'Debes iniciar sesión para consultar el historial.';
  END IF;

  IF NOT public.is_invitta_sales_operator() THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHORIZED_OPERATOR'
      USING ERRCODE = '42501',
            DETAIL = 'Acceso denegado al historial de créditos del estudio.';
  END IF;

  IF target_studio_id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_INVALID_STUDIO_ID'
      USING ERRCODE = '22023',
            DETAIL = 'Se requiere un studio_id válido.';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.studio_id,
    l.actor_user_id,
    l.operator_user_id,
    l.delta_credits,
    l.balance_after,
    l.transaction_type,
    l.reason,
    l.note,
    l.created_at
  FROM public.studio_credit_ledger l
  WHERE l.studio_id = target_studio_id
  ORDER BY l.created_at DESC
  LIMIT 50;
END;
$function$;

grant execute on function "public"."list_studio_credit_ledger"(uuid) to "authenticated", "postgres", "service_role";

revoke all on function "public"."list_studio_credit_ledger"(uuid) from public;
