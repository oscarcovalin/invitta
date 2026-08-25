create or replace function public.activate_studio_invitation_qr (
  target_invitation_id uuid
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public', 'pg_temp'
  AS $function$
DECLARE
  v_user_id uuid;
  v_inv public.studio_invitations%ROWTYPE;
  v_studio public.studios%ROWTYPE;
  v_caller_role text;
  v_cliente_id uuid;
  v_target_evento_id uuid;
  v_existing_event_cliente_id uuid;
  v_normalized_type text;
  v_normalized_date timestamptz;
  v_remaining_credits integer;
  v_is_operator boolean := false;
  v_should_charge boolean := false;
  v_credits_charged integer := 0;
  v_new_qr_cost integer := 0;
  v_new_charged_at timestamptz := NULL;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_UNAUTHENTICATED'
      USING ERRCODE = '42501',
            DETAIL = 'Debes iniciar sesión para activar este módulo.';
  END IF;

  IF target_invitation_id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_INVALID_INVITATION_ID'
      USING ERRCODE = '22023',
            DETAIL = 'El identificador de la invitación es requerido.';
  END IF;

  SELECT *
  INTO v_inv
  FROM public.studio_invitations
  WHERE id = target_invitation_id
  FOR UPDATE;

  IF v_inv.id IS NULL THEN
    RAISE EXCEPTION 'INVITTA_INVITATION_NOT_FOUND'
      USING ERRCODE = 'P0002',
            DETAIL = 'La invitación especificada no existe.';
  END IF;

  v_is_operator := public.is_invitta_sales_operator();

  IF NOT v_is_operator THEN
    SELECT sm.role
    INTO v_caller_role
    FROM public.studio_members sm
    WHERE sm.studio_id = v_inv.studio_id
      AND sm.user_id = v_user_id;

    IF v_caller_role IS NULL THEN
      SELECT 'owner'
      INTO v_caller_role
      FROM public.studios s
      WHERE s.id = v_inv.studio_id
        AND s.user_id = v_user_id;
    END IF;

    IF v_caller_role NOT IN ('owner', 'manager') OR v_caller_role IS NULL THEN
      RAISE EXCEPTION 'INVITTA_UNAUTHORIZED_STUDIO'
        USING ERRCODE = '42501',
              DETAIL = 'Solo administradores o managers del estudio pueden activar el módulo de invitados.';
    END IF;
  END IF;

  SELECT *
  INTO v_studio
  FROM public.studios
  WHERE id = v_inv.studio_id;

  v_should_charge := (
    v_inv.qr_credit_charged_at IS NULL
    AND v_inv.evento_id IS NULL
  );

  IF v_should_charge THEN
    UPDATE public.studios
    SET
      available_credits = available_credits - 1,
      used_credits = used_credits + 1
    WHERE id = v_inv.studio_id
      AND available_credits >= 1
    RETURNING available_credits
    INTO v_remaining_credits;

    IF v_remaining_credits IS NULL THEN
      RAISE EXCEPTION 'INVITTA_INSUFFICIENT_CREDITS_QR'
        USING ERRCODE = 'P0001',
              DETAIL = 'No cuentas con créditos disponibles para activar el panel de invitados y pases QR (Costo: 1 crédito).';
    END IF;

    v_credits_charged := 1;
    v_new_qr_cost := 1;
    v_new_charged_at := now();
  ELSE
    SELECT available_credits
    INTO v_remaining_credits
    FROM public.studios
    WHERE id = v_inv.studio_id;

    v_credits_charged := 0;
    v_new_qr_cost := COALESCE(v_inv.qr_credit_cost, 0);
    v_new_charged_at := v_inv.qr_credit_charged_at;
  END IF;

  INSERT INTO public.clientes (
    nombre,
    email_contacto,
    plan,
    estado,
    studio_id
  ) VALUES (
    COALESCE(NULLIF(trim(v_studio.name), ''), 'Invitta Studio'),
    (SELECT email FROM auth.users WHERE id = v_user_id),
    'studio',
    'activo',
    v_studio.id
  )
  ON CONFLICT (studio_id) WHERE studio_id IS NOT NULL
  DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email_contacto = EXCLUDED.email_contacto,
    updated_at = now()
  RETURNING id
  INTO v_cliente_id;

  INSERT INTO public.cliente_usuarios (
    cliente_id,
    user_id,
    rol
  ) VALUES (
    v_cliente_id,
    v_user_id,
    CASE WHEN v_caller_role = 'owner' THEN 'owner' ELSE 'admin' END
  )
  ON CONFLICT (cliente_id, user_id) DO UPDATE
  SET rol = CASE
    WHEN public.cliente_usuarios.rol = 'owner' THEN 'owner'
    ELSE EXCLUDED.rol
  END;

  v_normalized_type := CASE
    WHEN lower(COALESCE(v_inv.event_type, '')) LIKE '%xv%' THEN 'xv'
    WHEN lower(COALESCE(v_inv.event_type, '')) LIKE '%boda%' THEN 'boda'
    ELSE 'otro'
  END;

  IF v_inv.event_date IS NOT NULL THEN
    v_normalized_date := v_inv.event_date::date::timestamptz;
  END IF;

  v_target_evento_id := v_inv.evento_id;

  IF v_target_evento_id IS NULL THEN
    SELECT id, cliente_id
    INTO v_target_evento_id, v_existing_event_cliente_id
    FROM public.eventos
    WHERE slug = v_inv.slug;

    IF v_target_evento_id IS NOT NULL
       AND v_existing_event_cliente_id <> v_cliente_id THEN
      RAISE EXCEPTION 'The invitation slug is already linked to another account'
        USING ERRCODE = '23505';
    END IF;

    IF v_target_evento_id IS NULL THEN
      INSERT INTO public.eventos (
        cliente_id,
        nombre,
        tipo,
        slug,
        fecha_evento,
        ubicacion,
        config,
        estado
      ) VALUES (
        v_cliente_id,
        COALESCE(NULLIF(trim(v_inv.title), ''), NULLIF(trim(v_inv.honoree_name), ''), 'Evento'),
        v_normalized_type,
        v_inv.slug,
        v_normalized_date,
        COALESCE(NULLIF(trim(v_inv.reception_address), ''), NULLIF(trim(v_inv.ceremony_address), '')),
        jsonb_build_object(
          'inviteUrl', '/invitacion.html?slug=' || v_inv.slug,
          'studioInvitationId', v_inv.id
        ),
        CASE WHEN v_inv.published THEN 'activo' ELSE 'borrador' END
      )
      RETURNING id
      INTO v_target_evento_id;
    END IF;
  ELSE
    SELECT cliente_id
    INTO v_existing_event_cliente_id
    FROM public.eventos
    WHERE id = v_target_evento_id;

    IF v_existing_event_cliente_id IS NULL
       OR v_existing_event_cliente_id <> v_cliente_id THEN
      RAISE EXCEPTION 'The linked event does not belong to this studio'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.eventos
  SET
    cliente_id = v_cliente_id,
    nombre = COALESCE(NULLIF(trim(v_inv.title), ''), NULLIF(trim(v_inv.honoree_name), ''), 'Evento'),
    tipo = v_normalized_type,
    slug = v_inv.slug,
    fecha_evento = v_normalized_date,
    ubicacion = COALESCE(NULLIF(trim(v_inv.reception_address), ''), NULLIF(trim(v_inv.ceremony_address), '')),
    config = COALESCE(public.eventos.config, '{}'::jsonb) || jsonb_build_object(
      'inviteUrl', '/invitacion.html?slug=' || v_inv.slug,
      'studioInvitationId', v_inv.id
    ),
    estado = CASE WHEN v_inv.published THEN 'activo' ELSE 'borrador' END,
    updated_at = now()
  WHERE id = v_target_evento_id;

  UPDATE public.studio_invitations
  SET
    evento_id = v_target_evento_id,
    qr_enabled = true,
    qr_credit_cost = v_new_qr_cost,
    qr_credit_charged_at = v_new_charged_at
  WHERE id = target_invitation_id;

  IF v_should_charge THEN
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
      v_inv.studio_id,
      v_user_id,
      NULL,
      -1,
      v_remaining_credits,
      'qr_activation',
      'qr_guest_panel_activation',
      'Activación de pases QR y panel de invitados para invitación: ' || target_invitation_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN v_should_charge THEN 'activated' ELSE 'already_active' END,
    'invitation_id', target_invitation_id,
    'studio_id', v_inv.studio_id,
    'evento_id', v_target_evento_id,
    'qr_enabled', true,
    'qr_credit_cost', v_new_qr_cost,
    'credits_charged', v_credits_charged,
    'available_credits', v_remaining_credits
  );
END;
$function$;

grant execute on function "public"."activate_studio_invitation_qr"(uuid) to "authenticated", "postgres", "service_role";

revoke all on function "public"."activate_studio_invitation_qr"(uuid) from public;
