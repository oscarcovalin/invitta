create or replace function public.grant_studio_credits (
  target_studio_id uuid,
  amount           integer,
  reason           text,
  note             text    default null::text
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
DECLARE
  v_operator_id uuid;
  v_new_balance integer;
  v_plan text;
  v_clean_reason text;
  v_clean_note text;
BEGIN
  v_operator_id := auth.uid();

  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHENTICATED'
      USING ERRCODE = '42501',
            DETAIL = 'Debes iniciar sesión para realizar esta operación.';
  END IF;

  IF NOT public.is_invitta_sales_operator() THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHORIZED_OPERATOR'
      USING ERRCODE = '42501',
            DETAIL = 'No tienes privilegios de operador para otorgar créditos.';
  END IF;

  IF amount IS NULL OR amount <= 0 THEN
    RAISE EXCEPTION 'INVITTA_INVALID_AMOUNT'
      USING ERRCODE = '22023',
            DETAIL = 'La cantidad de créditos debe ser un número entero mayor a 0.';
  END IF;

  IF amount > 500 THEN
    RAISE EXCEPTION 'INVITTA_AMOUNT_TOO_LARGE'
      USING ERRCODE = '22023',
            DETAIL = 'La recarga máxima permitida por operación es de 500 créditos.';
  END IF;

  v_clean_reason := trim(COALESCE(reason, ''));

  IF length(v_clean_reason) = 0 THEN
    RAISE EXCEPTION 'INVITTA_INVALID_REASON'
      USING ERRCODE = '22023',
            DETAIL = 'Debes especificar un motivo válido para la recarga.';
  END IF;

  v_clean_note := NULLIF(trim(COALESCE(note, '')), '');

  UPDATE public.studios
  SET available_credits = available_credits + amount
  WHERE id = target_studio_id
  RETURNING available_credits, plan_tier
  INTO v_new_balance, v_plan;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'INVITTA_STUDIO_NOT_FOUND'
      USING ERRCODE = 'P0002',
            DETAIL = 'El estudio destino no existe.';
  END IF;

  INSERT INTO public.studio_credit_ledger (
    studio_id,
    actor_user_id,
    operator_user_id,
    delta_credits,
    balance_after,
    transaction_type,
    reason,
    note
  ) VALUES (
    target_studio_id,
    v_operator_id,
    v_operator_id,
    amount,
    v_new_balance,
    'manual_grant',
    v_clean_reason,
    v_clean_note
  );

  RETURN jsonb_build_object(
    'success', true,
    'studio_id', target_studio_id,
    'credits_added', amount,
    'available_credits', v_new_balance,
    'plan_tier', v_plan,
    'reason', v_clean_reason
  );
END;
$function$;

grant execute on function "public"."grant_studio_credits"(uuid, integer, text, text) to "authenticated", "postgres", "service_role";

revoke all on function "public"."grant_studio_credits"(uuid, integer, text, text) from public;
