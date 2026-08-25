create or replace function public.consume_studio_invitation_credit()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
DECLARE
  v_remaining integer;
  v_studio_owner_id uuid;
  v_actor_id uuid;
BEGIN
  UPDATE public.studios
  SET
    available_credits = available_credits - 1,
    used_credits = used_credits + 1
  WHERE id = NEW.studio_id
    AND available_credits >= 1
  RETURNING available_credits, user_id
  INTO v_remaining, v_studio_owner_id;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'INVITTA_INSUFFICIENT_CREDITS'
      USING ERRCODE = 'P0001',
            DETAIL = 'No cuentas con créditos disponibles para crear una nueva invitación.';
  END IF;

  v_actor_id := COALESCE(auth.uid(), v_studio_owner_id);

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_ACTOR_NOT_FOUND'
      USING ERRCODE = '42501',
            DETAIL = 'No fue posible determinar el actor de la transacción.';
  END IF;

  NEW.credit_cost := 1;
  NEW.credit_charged_at := now();

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
    NEW.studio_id,
    v_actor_id,
    NULL,
    -1,
    v_remaining,
    'invitation_creation',
    'invitation_created',
    'invitation_id=' || NEW.id
      || '; slug=' || COALESCE(NEW.slug, 'N/A')
      || '; title=' || COALESCE(NULLIF(trim(NEW.title), ''), 'Sin título')
  );

  RETURN NEW;
END;
$function$;

grant execute on function "public"."consume_studio_invitation_credit"() to "postgres", "service_role";

revoke all on function "public"."consume_studio_invitation_credit"() from public;
