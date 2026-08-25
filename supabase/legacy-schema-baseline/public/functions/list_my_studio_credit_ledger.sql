create or replace function public.list_my_studio_credit_ledger (
  target_studio_id uuid
)
  returns table (
    id               uuid,
    delta_credits    integer,
    balance_after    integer,
    transaction_type text,
    reason           text,
    description      text,
    created_at       timestamp with time zone
  )
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
DECLARE
  v_user_id uuid;
  v_has_access boolean := false;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHENTICATED'
      USING ERRCODE = '42501';
  END IF;

  IF target_studio_id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_INVALID_STUDIO_ID'
      USING ERRCODE = '22023';
  END IF;

  IF public.is_invitta_sales_operator() THEN
    v_has_access := true;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.studio_members sm
      WHERE sm.studio_id = target_studio_id
        AND sm.user_id = v_user_id
        AND sm.role IN ('owner', 'manager')
    )
    OR EXISTS (
      SELECT 1
      FROM public.studios s
      WHERE s.id = target_studio_id
        AND s.user_id = v_user_id
    )
    INTO v_has_access;
  END IF;

  IF NOT v_has_access THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHORIZED_STUDIO'
      USING ERRCODE = '42501',
            DETAIL = 'No tienes permisos para ver el historial de este estudio.';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.delta_credits,
    l.balance_after,
    l.transaction_type,
    l.reason,
    CASE
      WHEN l.transaction_type = 'manual_grant'
        THEN 'Recarga de créditos'
      WHEN l.transaction_type = 'invitation_creation'
        THEN 'Creación de invitación: ' || COALESCE(NULLIF(split_part(l.note, '; title=', 2), ''), 'Sin título')
      WHEN l.transaction_type = 'qr_activation'
        THEN 'Activación Pases QR: ' || COALESCE(NULLIF(split_part(l.note, '; title=', 2), ''), 'Invitación')
      ELSE 'Movimiento en cuenta'
    END AS description,
    l.created_at
  FROM public.studio_credit_ledger l
  WHERE l.studio_id = target_studio_id
  ORDER BY l.created_at DESC
  LIMIT 100;
END;
$function$;

grant execute on function "public"."list_my_studio_credit_ledger"(uuid) to "authenticated", "postgres", "service_role";

revoke all on function "public"."list_my_studio_credit_ledger"(uuid) from public;
