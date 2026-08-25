


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."activate_studio_invitation_qr"("target_invitation_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."activate_studio_invitation_qr"("target_invitation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_in_vip_guest"("target_guest_id" "uuid", "scanned_token" "text" DEFAULT NULL::"text", "checkin_method" "text" DEFAULT 'qr'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    guest_row public.invitados%rowtype;
    event_config jsonb;
    user_role text;
    access_status text;
    used_passes integer;
begin
    if auth.uid() is null then
        raise exception 'Authentication required';
    end if;

    select * into guest_row
    from public.invitados
    where id = target_guest_id
    for update;

    if guest_row.id is null then
        return jsonb_build_object('ok', false, 'code', 'not_found');
    end if;

    user_role := public.current_user_event_role(guest_row.evento_id);
    if user_role not in ('owner', 'admin', 'staff') then
        raise exception 'Not authorized for this event';
    end if;

    select coalesce(config, '{}'::jsonb) into event_config
    from public.eventos
    where id = guest_row.evento_id;

    if coalesce((event_config ->> 'qrAccessEnabled')::boolean, false) is not true then
        return jsonb_build_object('ok', false, 'code', 'vip_required');
    end if;

    if checkin_method = 'qr'
       and (nullif(trim(coalesce(scanned_token, '')), '') is null
            or guest_row.qr_token <> scanned_token) then
        return jsonb_build_object('ok', false, 'code', 'invalid_token');
    end if;

    used_passes := greatest(1, coalesce(nullif(guest_row.pases_confirmados, 0), guest_row.pases_asignados, 1));

    if guest_row.qr_status = 'cancelled' then
        access_status := 'rechazado';
    elsif guest_row.checked_in is true or guest_row.qr_status = 'used' then
        access_status := 'duplicado';
    elsif lower(coalesce(guest_row.estado, '')) not like 'confirmad%' then
        access_status := 'rechazado';
    else
        access_status := case when checkin_method = 'manual' then 'manual' else 'validado' end;
    end if;

    insert into public.accesos (
        evento_id,
        invitado_id,
        qr_token,
        pases_usados,
        status,
        checked_in_by
    ) values (
        guest_row.evento_id,
        guest_row.id,
        guest_row.qr_token,
        used_passes,
        access_status,
        auth.uid()
    );

    if access_status = 'duplicado' then
        return jsonb_build_object('ok', false, 'code', 'duplicate');
    end if;

    if guest_row.qr_status = 'cancelled' then
        return jsonb_build_object('ok', false, 'code', 'cancelled');
    end if;

    if lower(coalesce(guest_row.estado, '')) not like 'confirmad%' then
        return jsonb_build_object('ok', false, 'code', 'not_confirmed');
    end if;

    update public.invitados
    set checked_in = true,
        checked_in_at = now(),
        checked_in_by = auth.uid(),
        qr_status = 'used'
    where id = guest_row.id;

    return jsonb_build_object(
        'ok', true,
        'code', 'checked_in',
        'guestId', guest_row.id,
        'eventId', guest_row.evento_id,
        'passes', used_passes
    );
end;
$$;


ALTER FUNCTION "public"."check_in_vip_guest"("target_guest_id" "uuid", "scanned_token" "text", "checkin_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirmar_checkin"("p_qr_token" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_token text;
  v_invitado public.invitados;
  v_resultado public.invitados;
  v_matches integer;
begin
  v_token := trim(coalesce(p_qr_token, ''));

  if v_token = '' then
    return jsonb_build_object(
      'ok', false,
      'message', 'QR sin token',
      'debug_token_recibido', p_qr_token
    );
  end if;

  if position('token=' in v_token) > 0 then
    v_token := split_part(v_token, 'token=', 2);
    v_token := split_part(v_token, '&', 1);
    v_token := trim(v_token);
  end if;

  select count(*)
  into v_matches
  from public.invitados
  where trim(qr_token::text) = v_token;

  select *
  into v_invitado
  from public.invitados
  where trim(qr_token::text) = v_token
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'message', 'QR inválido',
      'debug_token_recibido', p_qr_token,
      'debug_token_normalizado', v_token,
      'debug_coincidencias', v_matches
    );
  end if;

  if coalesce(v_invitado.checked_in, false) = true
     or coalesce(v_invitado.qr_status, '') = 'used' then
    return jsonb_build_object(
      'ok', true,
      'already_checked_in', true,
      'message', 'El invitado ya había ingresado',
      'invitado', to_jsonb(v_invitado),
      'debug_token_normalizado', v_token
    );
  end if;

  update public.invitados
  set
    checked_in = true,
    checked_in_at = now(),
    qr_status = 'used'
  where id = v_invitado.id
  returning * into v_resultado;

  insert into public.checkins (
    evento_id,
    invitado_id,
    qr_token,
    status,
    notes
  )
  values (
    v_resultado.evento_id,
    v_resultado.id,
    v_resultado.qr_token::text,
    'valid',
    'Check-in confirmado'
  );

  return jsonb_build_object(
    'ok', true,
    'already_checked_in', false,
    'message', 'Entrada confirmada correctamente',
    'invitado', to_jsonb(v_resultado),
    'debug_token_normalizado', v_token
  );
end;
$$;


ALTER FUNCTION "public"."confirmar_checkin"("p_qr_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_studio_invitation_credit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."consume_studio_invitation_credit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_invitta_studio"() RETURNS TABLE("id" "uuid", "name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select s.id, s.name
    from public.studios s
    join public.studio_members sm on sm.studio_id = s.id
    where sm.user_id = auth.uid()
    order by case sm.role when 'owner' then 0 when 'manager' then 1 else 2 end, s.created_at
    limit 1;
$$;


ALTER FUNCTION "public"."current_invitta_studio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_dashboard_events"() RETURNS TABLE("evento_id" "uuid", "rol" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."current_user_dashboard_events"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_event_role"("target_evento_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."current_user_event_role"("target_evento_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_invitation_guest"("invitation_slug" "text", "guest_token" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select jsonb_build_object(
        'id', g.id,
        'name', g.nombre,
        'family', g.familia,
        'passes', g.pases_asignados,
        'confirmedPasses', g.pases_confirmados,
        'table', g.mesa,
        'status', g.estado
    )
    from public.studio_invitations si
    join public.invitados g on g.evento_id = si.evento_id
    where si.slug = invitation_slug
      and si.published = true
      and g.qr_token = guest_token
    limit 1;
$$;


ALTER FUNCTION "public"."get_public_invitation_guest"("invitation_slug" "text", "guest_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_studio_credits"("target_studio_id" "uuid", "amount" integer, "reason" "text", "note" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."grant_studio_credits"("target_studio_id" "uuid", "amount" integer, "reason" "text", "note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_cliente_member"("target_cliente_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.cliente_usuarios cu
        where cu.cliente_id = target_cliente_id
          and cu.user_id = auth.uid()
    );
$$;


ALTER FUNCTION "public"."is_cliente_member"("target_cliente_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_event_member"("target_evento_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."is_event_member"("target_evento_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_invitta_sales_operator"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.invitta_sales_operators
        where user_id = auth.uid()
    );
$$;


ALTER FUNCTION "public"."is_invitta_sales_operator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_invitta_studio_manager"("target_studio_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.studio_members
        where studio_id = target_studio_id
          and user_id = auth.uid()
          and role in ('owner', 'manager')
    );
$$;


ALTER FUNCTION "public"."is_invitta_studio_manager"("target_studio_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_invitta_studio_member"("target_studio_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.studio_members
        where studio_id = target_studio_id
          and user_id = auth.uid()
    );
$$;


ALTER FUNCTION "public"."is_invitta_studio_member"("target_studio_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_my_studio_credit_ledger"("target_studio_id" "uuid") RETURNS TABLE("id" "uuid", "delta_credits" integer, "balance_after" integer, "transaction_type" "text", "reason" "text", "description" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."list_my_studio_credit_ledger"("target_studio_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_studio_credit_admin"() RETURNS TABLE("id" "uuid", "name" "text", "plan_tier" "text", "available_credits" integer, "used_credits" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."list_studio_credit_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_studio_credit_ledger"("target_studio_id" "uuid") RETURNS TABLE("id" "uuid", "studio_id" "uuid", "actor_user_id" "uuid", "operator_user_id" "uuid", "delta_credits" integer, "balance_after" integer, "transaction_type" "text", "reason" "text", "note" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."list_studio_credit_ledger"("target_studio_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."provision_my_invitta_studio"() RETURNS TABLE("studio_id" "uuid", "studio_name" "text", "studio_role" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    current_user_id uuid := auth.uid();
    requested_name text;
    existing_studio_id uuid;
    existing_studio_name text;
    existing_studio_role text;
begin
    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not exists (
        select 1
        from auth.users
        where id = current_user_id
          and email_confirmed_at is not null
    ) then
        raise exception 'Email confirmation required';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

    select s.id, s.name, sm.role
      into existing_studio_id, existing_studio_name, existing_studio_role
    from public.studios s
    join public.studio_members sm on sm.studio_id = s.id
    where sm.user_id = current_user_id
    order by case sm.role when 'owner' then 0 when 'manager' then 1 else 2 end
    limit 1;

    if existing_studio_id is null then
        select s.id, s.name
          into existing_studio_id, existing_studio_name
        from public.studios s
        where s.user_id = current_user_id
        limit 1;

        if existing_studio_id is not null then
            existing_studio_role := 'owner';
        end if;
    end if;

    requested_name := left(trim(coalesce(
        (select raw_user_meta_data ->> 'studio_name' from auth.users where id = current_user_id),
        ''
    )), 120);

    if requested_name = '' then
        requested_name := left(coalesce(
            (select split_part(email, '@', 1) from auth.users where id = current_user_id),
            'Nuevo Studio'
        ), 120);
    end if;

    if existing_studio_id is null then
        insert into public.studios (user_id, name)
        values (current_user_id, requested_name)
        returning id, name into existing_studio_id, existing_studio_name;
        existing_studio_role := 'owner';
    end if;

    insert into public.studio_members (studio_id, user_id, role)
    values (existing_studio_id, current_user_id, 'owner')
    on conflict on constraint studio_members_pkey do nothing;

    select sm.role into existing_studio_role
    from public.studio_members sm
    where sm.studio_id = existing_studio_id
      and sm.user_id = current_user_id;

    return query
    select existing_studio_id, existing_studio_name, existing_studio_role;
end;
$$;


ALTER FUNCTION "public"."provision_my_invitta_studio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_studio_invitation_lifecycle"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    should_start_new_period boolean;
    template_changed boolean := false;
begin
    if new.published is not true then
        return new;
    end if;

    if tg_op = 'INSERT' then
        should_start_new_period := true;
    else
        should_start_new_period := old.published is distinct from true
            or new.published_at is null;
        template_changed := new.template_id is distinct from old.template_id;
    end if;

    if should_start_new_period then
        new.published_at := now();
    end if;

    if should_start_new_period
       or template_changed
       or new.expires_at is null then
        new.expires_at := new.published_at
            + make_interval(months => public.studio_invitation_active_months(new.template_id));
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."set_studio_invitation_lifecycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."studio_invitation_active_months"("template_id" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
    select case public.studio_invitation_package_tier(template_id)
        when 'vip' then 12
        when 'premium' then 4
        else 2
    end;
$$;


ALTER FUNCTION "public"."studio_invitation_active_months"("template_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."studio_invitation_package_tier"("template_id" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
    select case
        when coalesce(template_id, '') like '%-vip' then 'vip'
        when coalesce(template_id, '') like '%-premium' then 'premium'
        else 'essential'
    end;
$$;


ALTER FUNCTION "public"."studio_invitation_package_tier"("template_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_public_invitation_rsvp"("invitation_slug" "text", "guest_token" "text", "attending" boolean, "confirmed_passes" integer, "guest_message" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    guest_row public.invitados%rowtype;
    safe_passes integer;
    new_status text;
begin
    select g.* into guest_row
    from public.studio_invitations si
    join public.invitados g on g.evento_id = si.evento_id
    where si.slug = invitation_slug
      and si.published = true
      and g.qr_token = guest_token
    limit 1;

    if guest_row.id is null then
        raise exception 'Invalid invitation guest';
    end if;

    safe_passes := case
        when attending and guest_row.pases_asignados > 0
            then greatest(1, least(coalesce(confirmed_passes, 1), guest_row.pases_asignados))
        else 0
    end;
    new_status := case when attending then 'Confirmado' else 'No asistira' end;

    update public.invitados set
        pases_confirmados = safe_passes,
        estado = new_status,
        confirmed_at = now(),
        updated_at = now()
    where id = guest_row.id;

    insert into public.confirmaciones (
        evento_id,
        invitado_id,
        asiste,
        pases_confirmados,
        mensaje,
        origen
    ) values (
        guest_row.evento_id,
        guest_row.id,
        attending,
        safe_passes,
        nullif(left(coalesce(guest_message, ''), 1000), ''),
        'invitacion'
    );

    return jsonb_build_object(
        'ok', true,
        'status', new_status,
        'confirmedPasses', safe_passes
    );
end;
$$;


ALTER FUNCTION "public"."submit_public_invitation_rsvp"("invitation_slug" "text", "guest_token" "text", "attending" boolean, "confirmed_passes" integer, "guest_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_studio_invitation_access_config"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    package_tier text;
begin
    if new.evento_id is null then
        return new;
    end if;

    package_tier := public.studio_invitation_package_tier(new.template_id);

    update public.eventos
    set config = coalesce(config, '{}'::jsonb) || jsonb_build_object(
        'templateId', new.template_id,
        'packageTier', package_tier,
        'qrAccessEnabled', package_tier = 'vip'
    )
    where id = new.evento_id;

    return new;
end;
$$;


ALTER FUNCTION "public"."sync_studio_invitation_access_config"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_studio_invitation_event"("target_invitation_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_res jsonb;
BEGIN
  v_res := public.activate_studio_invitation_qr(target_invitation_id);
  RETURN (v_res->>'evento_id')::uuid;
END;
$$;


ALTER FUNCTION "public"."sync_studio_invitation_event"("target_invitation_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accesos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evento_id" "uuid" NOT NULL,
    "invitado_id" "uuid" NOT NULL,
    "qr_token" "text" NOT NULL,
    "pases_usados" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'validado'::"text" NOT NULL,
    "checked_in_by" "uuid",
    "checked_in_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accesos_pases_usados_check" CHECK (("pases_usados" > 0)),
    CONSTRAINT "accesos_status_check" CHECK (("status" = ANY (ARRAY['validado'::"text", 'duplicado'::"text", 'rechazado'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."accesos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evento_id" "uuid" NOT NULL,
    "invitado_id" "uuid",
    "qr_token" "text",
    "scanned_by" "uuid",
    "scanned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "checkins_status_check" CHECK (("status" = ANY (ARRAY['valid'::"text", 'duplicate'::"text", 'invalid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cliente_usuarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cliente_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rol" "text" DEFAULT 'cliente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cliente_usuarios_rol_check" CHECK (("rol" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text", 'cliente'::"text"])))
);


ALTER TABLE "public"."cliente_usuarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "email_contacto" "text",
    "telefono" "text",
    "plan" "text" DEFAULT 'demo'::"text" NOT NULL,
    "estado" "text" DEFAULT 'activo'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "studio_id" "uuid",
    CONSTRAINT "clientes_estado_check" CHECK (("estado" = ANY (ARRAY['activo'::"text", 'pausado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."confirmaciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evento_id" "uuid" NOT NULL,
    "invitado_id" "uuid" NOT NULL,
    "asiste" boolean NOT NULL,
    "pases_confirmados" integer DEFAULT 0 NOT NULL,
    "mensaje" "text",
    "origen" "text" DEFAULT 'dashboard'::"text" NOT NULL,
    "confirmed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "confirmaciones_origen_check" CHECK (("origen" = ANY (ARRAY['dashboard'::"text", 'invitacion'::"text", 'whatsapp'::"text", 'manual'::"text"]))),
    CONSTRAINT "confirmaciones_pases_confirmados_check" CHECK (("pases_confirmados" >= 0))
);


ALTER TABLE "public"."confirmaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evento_usuarios" (
    "evento_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rol" "text" DEFAULT 'cliente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "evento_usuarios_rol_check" CHECK (("rol" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text", 'cliente'::"text"])))
);


ALTER TABLE "public"."evento_usuarios" OWNER TO "postgres";


COMMENT ON TABLE "public"."evento_usuarios" IS 'Event-scoped dashboard access. Keeps end clients isolated from other Studio events.';



CREATE TABLE IF NOT EXISTS "public"."eventos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cliente_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "tipo" "text" DEFAULT 'boda'::"text" NOT NULL,
    "slug" "text" NOT NULL,
    "fecha_evento" timestamp with time zone,
    "ubicacion" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "theme" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "estado" "text" DEFAULT 'activo'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "eventos_estado_check" CHECK (("estado" = ANY (ARRAY['borrador'::"text", 'activo'::"text", 'archivado'::"text"]))),
    CONSTRAINT "eventos_tipo_check" CHECK (("tipo" = ANY (ARRAY['boda'::"text", 'xv'::"text", 'bautizo'::"text", 'cumpleanos'::"text", 'corporativo'::"text", 'otro'::"text"])))
);


ALTER TABLE "public"."eventos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evento_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "familia" "text",
    "email" "text",
    "telefono" "text",
    "mesa" "text",
    "pases_asignados" integer DEFAULT 1 NOT NULL,
    "pases_confirmados" integer DEFAULT 0 NOT NULL,
    "estado" "text" DEFAULT 'Pendiente'::"text" NOT NULL,
    "qr_token" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "notas" "text",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "qr_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "checked_in" boolean DEFAULT false NOT NULL,
    "checked_in_at" timestamp with time zone,
    "checked_in_by" "uuid",
    CONSTRAINT "invitados_estado_check" CHECK (("estado" = ANY (ARRAY['Confirmado'::"text", 'Pendiente'::"text", 'No asistira'::"text", 'No asistirá'::"text"]))),
    CONSTRAINT "invitados_pases_asignados_check" CHECK (("pases_asignados" >= 0)),
    CONSTRAINT "invitados_pases_confirmados_check" CHECK (("pases_confirmados" >= 0)),
    CONSTRAINT "invitados_qr_status_check" CHECK (("qr_status" = ANY (ARRAY['active'::"text", 'used'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."invitados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_album_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invitation_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "guest_name" "text" NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invitation_album_photos_guest_name_check" CHECK ((("char_length"("guest_name") >= 1) AND ("char_length"("guest_name") <= 120))),
    CONSTRAINT "invitation_album_photos_message_check" CHECK ((("message" IS NULL) OR ("char_length"("message") <= 500)))
);


ALTER TABLE "public"."invitation_album_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" "text" NOT NULL,
    "client_phone" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "design_name" "text",
    "requested_template_id" "text",
    "package_tier" "text" DEFAULT 'undecided'::"text" NOT NULL,
    "palette_preference" "text",
    "typography_preference" "text",
    "event_date" "date",
    "event_city" "text",
    "notes" "text",
    "source" "text" DEFAULT 'landing'::"text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "assigned_studio_id" "uuid",
    "claimed_by" "uuid",
    "claimed_at" timestamp with time zone,
    "converted_invitation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "stripe_session_id" "text",
    "payment_method" "text",
    "payment_amount_mxn" integer,
    "payment_email" "text",
    "paid_at" timestamp with time zone,
    CONSTRAINT "invitation_requests_package_tier_check" CHECK (("package_tier" = ANY (ARRAY['essential'::"text", 'premium'::"text", 'vip'::"text", 'undecided'::"text"]))),
    CONSTRAINT "invitation_requests_payment_amount_mxn_check" CHECK ((("payment_amount_mxn" IS NULL) OR ("payment_amount_mxn" > 0))),
    CONSTRAINT "invitation_requests_payment_method_check" CHECK ((("payment_method" IS NULL) OR ("payment_method" = ANY (ARRAY['card'::"text", 'oxxo'::"text"])))),
    CONSTRAINT "invitation_requests_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['not_started'::"text", 'pending'::"text", 'paid'::"text", 'failed'::"text", 'expired'::"text"]))),
    CONSTRAINT "invitation_requests_source_check" CHECK (("source" = ANY (ARRAY['landing'::"text", 'catalog'::"text", 'whatsapp'::"text", 'manual'::"text"]))),
    CONSTRAINT "invitation_requests_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'in_progress'::"text", 'won'::"text", 'lost'::"text"])))
);


ALTER TABLE "public"."invitation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "event_type" "text" DEFAULT 'general'::"text",
    "thumbnail_url" "text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invitation_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."invitation_templates" IS 'Plantillas reutilizables para invitaciones digitales.';



COMMENT ON COLUMN "public"."invitation_templates"."config" IS 'Configuración visual de la plantilla en formato JSON.';



CREATE TABLE IF NOT EXISTS "public"."invitta_sales_operators" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invitta_sales_operators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."studio_credit_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "studio_id" "uuid" NOT NULL,
    "operator_user_id" "uuid",
    "delta_credits" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "transaction_type" "text" DEFAULT 'manual_grant'::"text" NOT NULL,
    "reason" "text" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_user_id" "uuid" NOT NULL,
    CONSTRAINT "studio_credit_ledger_balance_non_negative" CHECK (("balance_after" >= 0)),
    CONSTRAINT "studio_credit_ledger_integrity" CHECK (((("transaction_type" = 'manual_grant'::"text") AND ("delta_credits" > 0) AND ("operator_user_id" IS NOT NULL) AND ("actor_user_id" IS NOT NULL)) OR (("transaction_type" = 'qr_activation'::"text") AND ("delta_credits" < 0) AND ("actor_user_id" IS NOT NULL)) OR (("transaction_type" = 'invitation_creation'::"text") AND ("delta_credits" < 0) AND ("actor_user_id" IS NOT NULL)))),
    CONSTRAINT "studio_credit_ledger_reason_not_empty" CHECK (("length"(TRIM(BOTH FROM "reason")) > 0))
);


ALTER TABLE "public"."studio_credit_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."studio_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "studio_id" "uuid" NOT NULL,
    "template_id" "text",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "event_type" "text" DEFAULT 'general'::"text",
    "honoree_name" "text",
    "event_date" "date",
    "event_time" time without time zone,
    "welcome_text" "text",
    "main_photo_url" "text",
    "gallery_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "music_url" "text",
    "color_primary" "text",
    "color_secondary" "text",
    "font_family" "text",
    "ceremony_name" "text",
    "ceremony_address" "text",
    "ceremony_map_url" "text",
    "reception_name" "text",
    "reception_address" "text",
    "reception_map_url" "text",
    "gift_table_url" "text",
    "dress_code" "text",
    "itinerary" "jsonb" DEFAULT '[]'::"jsonb",
    "whatsapp_number" "text",
    "published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "father_name" "text",
    "mother_name" "text",
    "godparents" "jsonb" DEFAULT '[]'::"jsonb",
    "instagram_hashtag" "text",
    "font_preset" "text" DEFAULT 'classic'::"text",
    "background_image_url" "text",
    "music_title" "text",
    "music_artist" "text",
    "visual_theme" "text" DEFAULT 'rose-floral'::"text",
    "thank_you_title" "text" DEFAULT 'Con cariño'::"text",
    "thank_you_message" "text" DEFAULT 'Gracias por ser parte de mis XV años'::"text",
    "thank_you_signature" "text" DEFAULT ''::"text",
    "hashtag_section_title" "text" DEFAULT 'Comparte el momento'::"text",
    "hashtag_section_message" "text" DEFAULT 'Usa el hashtag en tus fotos y videos para que no se pierda ningún recuerdo.'::"text",
    "studio_name" "text" DEFAULT 'Invitta Studio'::"text",
    "studio_logo_url" "text" DEFAULT ''::"text",
    "music_player_brand_enabled" boolean DEFAULT true,
    "studio_whatsapp" "text" DEFAULT ''::"text",
    "studio_cta_enabled" boolean DEFAULT true,
    "studio_cta_text" "text" DEFAULT 'Quiero una invitación así'::"text",
    "studio_cta_message" "text" DEFAULT 'Hola, me interesa contratar una invitación digital como esta.'::"text",
    "link_builder_enabled" boolean DEFAULT true,
    "link_builder_pin" "text" DEFAULT ''::"text",
    "link_builder_title" "text" DEFAULT 'Generador de pase personalizado'::"text",
    "link_builder_message" "text" DEFAULT 'Crea un enlace rápido para invitados de último momento.'::"text",
    "evento_id" "uuid",
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "palette_preset" "text" DEFAULT 'original'::"text" NOT NULL,
    "title_color" "text",
    "body_color" "text",
    "accent_color" "text",
    "custom_font_url" "text",
    "custom_font_name" "text",
    "custom_font_targets" "text"[] DEFAULT ARRAY['titles'::"text", 'subtitles'::"text", 'names'::"text"] NOT NULL,
    "client_dashboard_email" "text",
    "client_dashboard_user_id" "uuid",
    "client_dashboard_enabled" boolean DEFAULT false NOT NULL,
    "client_dashboard_last_sent_at" timestamp with time zone,
    "section_backgrounds" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "typography_fonts" "jsonb" DEFAULT '{}'::"jsonb",
    "bg_enabled" boolean DEFAULT false,
    "bg_scope" "text" DEFAULT 'all'::"text",
    "bg_overlay_enabled" boolean DEFAULT true,
    "bg_overlay_color" "text" DEFAULT '#000000'::"text",
    "bg_overlay_opacity" numeric DEFAULT 0.35,
    "bg_position" "text" DEFAULT 'center'::"text",
    "bg_size" "text" DEFAULT 'cover'::"text",
    "bg_blur" integer DEFAULT 0,
    "credit_cost" integer DEFAULT 1 NOT NULL,
    "credit_charged_at" timestamp with time zone,
    "qr_enabled" boolean DEFAULT false NOT NULL,
    "qr_credit_cost" integer DEFAULT 0 NOT NULL,
    "qr_credit_charged_at" timestamp with time zone,
    "gift_options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "dress_code_details" "text",
    "children_note" "text",
    "children_label" "text",
    "section_visibility" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "bg_image_opacity" numeric DEFAULT 0.18 NOT NULL,
    "bride_father_name" "text",
    "bride_mother_name" "text",
    "groom_father_name" "text",
    "groom_mother_name" "text",
    "honor_witness_name" "text",
    "shared_album_enabled" boolean DEFAULT false NOT NULL,
    "lodging_options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "studio_invitations_bg_image_opacity_range" CHECK ((("bg_image_opacity" >= (0)::numeric) AND ("bg_image_opacity" <= 0.60))),
    CONSTRAINT "studio_invitations_credit_cost_positive" CHECK (("credit_cost" >= 1)),
    CONSTRAINT "studio_invitations_gift_options_is_array" CHECK (("jsonb_typeof"("gift_options") = 'array'::"text")),
    CONSTRAINT "studio_invitations_lodging_options_is_array" CHECK (("jsonb_typeof"("lodging_options") = 'array'::"text")),
    CONSTRAINT "studio_invitations_qr_credit_cost_non_negative" CHECK (("qr_credit_cost" >= 0))
);


ALTER TABLE "public"."studio_invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."studio_invitations" IS 'Invitaciones digitales creadas por estudios dentro de Invitta Studio.';



COMMENT ON COLUMN "public"."studio_invitations"."slug" IS 'Identificador público único para cargar la invitación.';



COMMENT ON COLUMN "public"."studio_invitations"."gallery_urls" IS 'Lista JSON de URLs de fotografías adicionales.';



COMMENT ON COLUMN "public"."studio_invitations"."itinerary" IS 'Lista JSON flexible para horarios del evento.';



COMMENT ON COLUMN "public"."studio_invitations"."published_at" IS 'Start of the current paid publication period. NULL preserves legacy invitations.';



COMMENT ON COLUMN "public"."studio_invitations"."expires_at" IS 'End of the paid publication period derived from the selected package.';



COMMENT ON COLUMN "public"."studio_invitations"."palette_preset" IS 'Curated invitation palette. original preserves the template defaults.';



COMMENT ON COLUMN "public"."studio_invitations"."title_color" IS 'Optional curated title color override as a hexadecimal value.';



COMMENT ON COLUMN "public"."studio_invitations"."body_color" IS 'Optional curated body text color override as a hexadecimal value.';



COMMENT ON COLUMN "public"."studio_invitations"."accent_color" IS 'Optional curated accent color override as a hexadecimal value.';



COMMENT ON COLUMN "public"."studio_invitations"."custom_font_url" IS 'Public Storage URL for an optional WOFF2, WOFF, TTF or OTF display font.';



COMMENT ON COLUMN "public"."studio_invitations"."custom_font_name" IS 'Studio-facing label for the custom invitation font.';



COMMENT ON COLUMN "public"."studio_invitations"."custom_font_targets" IS 'Allowed custom font areas: titles, subtitles, names and body.';



COMMENT ON COLUMN "public"."studio_invitations"."gift_options" IS 'Configurable gift options for Studio invitations. Supports registry links and bank transfer details. Public invitation render must hide empty/demo gift cards for real Studio invitations.';



COMMENT ON COLUMN "public"."studio_invitations"."section_visibility" IS 'Optional public sections enabled per invitation. Keys: family, locations, itinerary, gallery, registry, rsvp, music.';



COMMENT ON COLUMN "public"."studio_invitations"."bg_image_opacity" IS 'Opacity of the decorative image overlay, from 0 to 0.60.';



COMMENT ON COLUMN "public"."studio_invitations"."bride_father_name" IS 'Optional name of the bride''s father for wedding invitations.';



COMMENT ON COLUMN "public"."studio_invitations"."bride_mother_name" IS 'Optional name of the bride''s mother for wedding invitations.';



COMMENT ON COLUMN "public"."studio_invitations"."groom_father_name" IS 'Optional name of the groom''s father for wedding invitations.';



COMMENT ON COLUMN "public"."studio_invitations"."groom_mother_name" IS 'Optional name of the groom''s mother for wedding invitations.';



COMMENT ON COLUMN "public"."studio_invitations"."honor_witness_name" IS 'Nombre del testigo de honor para bodas';



COMMENT ON COLUMN "public"."studio_invitations"."shared_album_enabled" IS 'Enables the premium guest photo album for this invitation.';



COMMENT ON COLUMN "public"."studio_invitations"."lodging_options" IS 'Optional lodging cards. Each item contains name, address, phone and map_url.';



CREATE TABLE IF NOT EXISTS "public"."studio_members" (
    "studio_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'editor'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "studio_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'editor'::"text"])))
);


ALTER TABLE "public"."studio_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."studios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "whatsapp" "text",
    "brand_color_primary" "text" DEFAULT '#111111'::"text",
    "brand_color_secondary" "text" DEFAULT '#d4af37'::"text",
    "brand_font_family" "text" DEFAULT 'Inter'::"text",
    "plan" "text" DEFAULT 'pilot'::"text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "plan_tier" "text" DEFAULT 'beta'::"text" NOT NULL,
    "available_credits" integer DEFAULT 0 NOT NULL,
    "used_credits" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "studios_available_credits_non_negative" CHECK (("available_credits" >= 0)),
    CONSTRAINT "studios_used_credits_non_negative" CHECK (("used_credits" >= 0))
);


ALTER TABLE "public"."studios" OWNER TO "postgres";


COMMENT ON TABLE "public"."studios" IS 'Studios registrados para operar invitaciones digitales marca blanca dentro de Invitta Studio.';



COMMENT ON COLUMN "public"."studios"."user_id" IS 'Usuario autenticado propietario del estudio.';



COMMENT ON COLUMN "public"."studios"."plan" IS 'Plan comercial: pilot, starter, pro, studio, white_label.';



ALTER TABLE ONLY "public"."accesos"
    ADD CONSTRAINT "accesos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cliente_usuarios"
    ADD CONSTRAINT "cliente_usuarios_cliente_id_user_id_key" UNIQUE ("cliente_id", "user_id");



ALTER TABLE ONLY "public"."cliente_usuarios"
    ADD CONSTRAINT "cliente_usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."confirmaciones"
    ADD CONSTRAINT "confirmaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evento_usuarios"
    ADD CONSTRAINT "evento_usuarios_pkey" PRIMARY KEY ("evento_id", "user_id");



ALTER TABLE ONLY "public"."eventos"
    ADD CONSTRAINT "eventos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."eventos"
    ADD CONSTRAINT "eventos_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."invitados"
    ADD CONSTRAINT "invitados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitados"
    ADD CONSTRAINT "invitados_qr_token_key" UNIQUE ("qr_token");



ALTER TABLE ONLY "public"."invitation_album_photos"
    ADD CONSTRAINT "invitation_album_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_album_photos"
    ADD CONSTRAINT "invitation_album_photos_storage_path_key" UNIQUE ("storage_path");



ALTER TABLE ONLY "public"."invitation_requests"
    ADD CONSTRAINT "invitation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_templates"
    ADD CONSTRAINT "invitation_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitta_sales_operators"
    ADD CONSTRAINT "invitta_sales_operators_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."studio_invitations"
    ADD CONSTRAINT "studio_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."studio_invitations"
    ADD CONSTRAINT "studio_invitations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."studio_members"
    ADD CONSTRAINT "studio_members_pkey" PRIMARY KEY ("studio_id", "user_id");



ALTER TABLE ONLY "public"."studios"
    ADD CONSTRAINT "studios_pkey" PRIMARY KEY ("id");



CREATE INDEX "checkins_evento_id_idx" ON "public"."checkins" USING "btree" ("evento_id");



CREATE INDEX "checkins_invitado_id_idx" ON "public"."checkins" USING "btree" ("invitado_id");



CREATE INDEX "checkins_qr_token_idx" ON "public"."checkins" USING "btree" ("qr_token");



CREATE UNIQUE INDEX "clientes_studio_id_unique_idx" ON "public"."clientes" USING "btree" ("studio_id") WHERE ("studio_id" IS NOT NULL);



CREATE INDEX "evento_usuarios_user_id_idx" ON "public"."evento_usuarios" USING "btree" ("user_id");



CREATE INDEX "idx_accesos_evento_id" ON "public"."accesos" USING "btree" ("evento_id");



CREATE INDEX "idx_accesos_invitado_id" ON "public"."accesos" USING "btree" ("invitado_id");



CREATE INDEX "idx_cliente_usuarios_user_id" ON "public"."cliente_usuarios" USING "btree" ("user_id");



CREATE INDEX "idx_confirmaciones_evento_id" ON "public"."confirmaciones" USING "btree" ("evento_id");



CREATE INDEX "idx_confirmaciones_invitado_id" ON "public"."confirmaciones" USING "btree" ("invitado_id");



CREATE INDEX "idx_eventos_cliente_id" ON "public"."eventos" USING "btree" ("cliente_id");



CREATE INDEX "idx_eventos_slug" ON "public"."eventos" USING "btree" ("slug");



CREATE INDEX "idx_invitados_evento_id" ON "public"."invitados" USING "btree" ("evento_id");



CREATE INDEX "idx_invitados_qr_token" ON "public"."invitados" USING "btree" ("qr_token");



CREATE INDEX "idx_invitation_templates_active" ON "public"."invitation_templates" USING "btree" ("active");



CREATE INDEX "idx_invitation_templates_event_type" ON "public"."invitation_templates" USING "btree" ("event_type");



CREATE INDEX "idx_studio_credit_ledger_operator" ON "public"."studio_credit_ledger" USING "btree" ("operator_user_id");



CREATE INDEX "idx_studio_credit_ledger_studio_date" ON "public"."studio_credit_ledger" USING "btree" ("studio_id", "created_at" DESC);



CREATE INDEX "idx_studio_invitations_event_type" ON "public"."studio_invitations" USING "btree" ("event_type");



CREATE INDEX "idx_studio_invitations_published" ON "public"."studio_invitations" USING "btree" ("published");



CREATE INDEX "idx_studio_invitations_slug" ON "public"."studio_invitations" USING "btree" ("slug");



CREATE INDEX "idx_studio_invitations_studio_id" ON "public"."studio_invitations" USING "btree" ("studio_id");



CREATE INDEX "idx_studio_invitations_template_id" ON "public"."studio_invitations" USING "btree" ("template_id");



CREATE INDEX "idx_studios_active" ON "public"."studios" USING "btree" ("active");



CREATE UNIQUE INDEX "idx_studios_unique_user_id" ON "public"."studios" USING "btree" ("user_id");



CREATE INDEX "idx_studios_user_id" ON "public"."studios" USING "btree" ("user_id");



CREATE UNIQUE INDEX "invitados_qr_token_unique_idx" ON "public"."invitados" USING "btree" ("qr_token") WHERE ("qr_token" IS NOT NULL);



CREATE INDEX "invitation_album_photos_invitation_created_idx" ON "public"."invitation_album_photos" USING "btree" ("invitation_id", "created_at" DESC);



CREATE INDEX "invitation_requests_assigned_studio_idx" ON "public"."invitation_requests" USING "btree" ("assigned_studio_id");



CREATE INDEX "invitation_requests_payment_status_idx" ON "public"."invitation_requests" USING "btree" ("payment_status", "created_at" DESC);



CREATE INDEX "invitation_requests_status_created_at_idx" ON "public"."invitation_requests" USING "btree" ("status", "created_at" DESC);



CREATE UNIQUE INDEX "invitation_requests_stripe_session_idx" ON "public"."invitation_requests" USING "btree" ("stripe_session_id") WHERE ("stripe_session_id" IS NOT NULL);



CREATE UNIQUE INDEX "studio_invitations_evento_id_unique_idx" ON "public"."studio_invitations" USING "btree" ("evento_id") WHERE ("evento_id" IS NOT NULL);



CREATE INDEX "studio_invitations_expires_at_idx" ON "public"."studio_invitations" USING "btree" ("expires_at") WHERE (("published" IS TRUE) AND ("expires_at" IS NOT NULL));



CREATE OR REPLACE TRIGGER "set_clientes_updated_at" BEFORE UPDATE ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_eventos_updated_at" BEFORE UPDATE ON "public"."eventos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_invitados_updated_at" BEFORE UPDATE ON "public"."invitados" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_invitation_requests_updated_at" BEFORE UPDATE ON "public"."invitation_requests" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_invitation_templates_updated_at" BEFORE UPDATE ON "public"."invitation_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_studio_invitation_lifecycle_trigger" BEFORE INSERT OR UPDATE OF "published", "template_id" ON "public"."studio_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."set_studio_invitation_lifecycle"();



CREATE OR REPLACE TRIGGER "set_studio_invitations_updated_at" BEFORE UPDATE ON "public"."studio_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_studios_updated_at" BEFORE UPDATE ON "public"."studios" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "sync_studio_invitation_access_config_trigger" AFTER INSERT OR UPDATE OF "template_id", "evento_id" ON "public"."studio_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."sync_studio_invitation_access_config"();



CREATE OR REPLACE TRIGGER "trg_consume_studio_invitation_credit" BEFORE INSERT ON "public"."studio_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."consume_studio_invitation_credit"();



ALTER TABLE ONLY "public"."accesos"
    ADD CONSTRAINT "accesos_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."accesos"
    ADD CONSTRAINT "accesos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accesos"
    ADD CONSTRAINT "accesos_invitado_id_fkey" FOREIGN KEY ("invitado_id") REFERENCES "public"."invitados"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_invitado_id_fkey" FOREIGN KEY ("invitado_id") REFERENCES "public"."invitados"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cliente_usuarios"
    ADD CONSTRAINT "cliente_usuarios_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cliente_usuarios"
    ADD CONSTRAINT "cliente_usuarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."confirmaciones"
    ADD CONSTRAINT "confirmaciones_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."confirmaciones"
    ADD CONSTRAINT "confirmaciones_invitado_id_fkey" FOREIGN KEY ("invitado_id") REFERENCES "public"."invitados"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evento_usuarios"
    ADD CONSTRAINT "evento_usuarios_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evento_usuarios"
    ADD CONSTRAINT "evento_usuarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."eventos"
    ADD CONSTRAINT "eventos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitados"
    ADD CONSTRAINT "invitados_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitados"
    ADD CONSTRAINT "invitados_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_album_photos"
    ADD CONSTRAINT "invitation_album_photos_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "public"."studio_invitations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_requests"
    ADD CONSTRAINT "invitation_requests_assigned_studio_id_fkey" FOREIGN KEY ("assigned_studio_id") REFERENCES "public"."studios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitation_requests"
    ADD CONSTRAINT "invitation_requests_claimed_by_fkey" FOREIGN KEY ("claimed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitation_requests"
    ADD CONSTRAINT "invitation_requests_converted_invitation_id_fkey" FOREIGN KEY ("converted_invitation_id") REFERENCES "public"."studio_invitations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitta_sales_operators"
    ADD CONSTRAINT "invitta_sales_operators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_operator_user_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."studio_credit_ledger"
    ADD CONSTRAINT "studio_credit_ledger_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."studio_invitations"
    ADD CONSTRAINT "studio_invitations_client_dashboard_user_id_fkey" FOREIGN KEY ("client_dashboard_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."studio_invitations"
    ADD CONSTRAINT "studio_invitations_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "public"."eventos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."studio_invitations"
    ADD CONSTRAINT "studio_invitations_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."studio_members"
    ADD CONSTRAINT "studio_members_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."studio_members"
    ADD CONSTRAINT "studio_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."studios"
    ADD CONSTRAINT "studios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."accesos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accesos_insert_event_staff" ON "public"."accesos" FOR INSERT WITH CHECK ((("public"."current_user_event_role"("evento_id") = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text"])) AND ("checked_in_by" = "auth"."uid"())));



CREATE POLICY "accesos_select_event_members" ON "public"."accesos" FOR SELECT USING ("public"."is_event_member"("evento_id"));



ALTER TABLE "public"."checkins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "checkins_insert_own_event" ON "public"."checkins" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."eventos" "e"
     JOIN "public"."cliente_usuarios" "cu" ON (("cu"."cliente_id" = "e"."cliente_id")))
  WHERE (("e"."id" = "checkins"."evento_id") AND ("cu"."user_id" = "auth"."uid"()) AND ("cu"."rol" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text"]))))));



CREATE POLICY "checkins_select_own_event" ON "public"."checkins" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."eventos" "e"
     JOIN "public"."cliente_usuarios" "cu" ON (("cu"."cliente_id" = "e"."cliente_id")))
  WHERE (("e"."id" = "checkins"."evento_id") AND ("cu"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."cliente_usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cliente_usuarios_select_own" ON "public"."cliente_usuarios" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "cliente_usuarios_select_own_clients" ON "public"."cliente_usuarios" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."is_cliente_member"("cliente_id")));



ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clientes_select_members" ON "public"."clientes" FOR SELECT USING ("public"."is_cliente_member"("id"));



CREATE POLICY "clientes_select_own" ON "public"."clientes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."cliente_usuarios" "cu"
  WHERE (("cu"."cliente_id" = "clientes"."id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "clientes_update_admins" ON "public"."clientes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."cliente_usuarios" "cu"
  WHERE (("cu"."cliente_id" = "clientes"."id") AND ("cu"."user_id" = "auth"."uid"()) AND ("cu"."rol" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."cliente_usuarios" "cu"
  WHERE (("cu"."cliente_id" = "clientes"."id") AND ("cu"."user_id" = "auth"."uid"()) AND ("cu"."rol" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."confirmaciones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "confirmaciones_insert_event_admins" ON "public"."confirmaciones" FOR INSERT WITH CHECK (("public"."current_user_event_role"("evento_id") = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text", 'cliente'::"text"])));



CREATE POLICY "confirmaciones_select_event_members" ON "public"."confirmaciones" FOR SELECT USING ("public"."is_event_member"("evento_id"));



ALTER TABLE "public"."evento_usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "evento_usuarios_select_own" ON "public"."evento_usuarios" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."eventos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "eventos_insert_admins" ON "public"."eventos" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."cliente_usuarios" "cu"
  WHERE (("cu"."cliente_id" = "eventos"."cliente_id") AND ("cu"."user_id" = "auth"."uid"()) AND ("cu"."rol" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "eventos_select_direct_members" ON "public"."eventos" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."evento_usuarios" "eu"
  WHERE (("eu"."evento_id" = "eventos"."id") AND ("eu"."user_id" = "auth"."uid"())))));



CREATE POLICY "eventos_select_members" ON "public"."eventos" FOR SELECT USING ("public"."is_cliente_member"("cliente_id"));



CREATE POLICY "eventos_select_own" ON "public"."eventos" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."cliente_usuarios" "cu"
  WHERE (("cu"."cliente_id" = "eventos"."cliente_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "eventos_update_admins" ON "public"."eventos" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."cliente_usuarios" "cu"
  WHERE (("cu"."cliente_id" = "eventos"."cliente_id") AND ("cu"."user_id" = "auth"."uid"()) AND ("cu"."rol" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."cliente_usuarios" "cu"
  WHERE (("cu"."cliente_id" = "eventos"."cliente_id") AND ("cu"."user_id" = "auth"."uid"()) AND ("cu"."rol" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



ALTER TABLE "public"."invitados" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitados_delete_event_admins" ON "public"."invitados" FOR DELETE USING (("public"."current_user_event_role"("evento_id") = ANY (ARRAY['owner'::"text", 'admin'::"text"])));



CREATE POLICY "invitados_insert_event_admins" ON "public"."invitados" FOR INSERT WITH CHECK (("public"."current_user_event_role"("evento_id") = ANY (ARRAY['owner'::"text", 'admin'::"text"])));



CREATE POLICY "invitados_select_event_members" ON "public"."invitados" FOR SELECT USING ("public"."is_event_member"("evento_id"));



CREATE POLICY "invitados_select_own_event" ON "public"."invitados" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."eventos" "e"
     JOIN "public"."cliente_usuarios" "cu" ON (("cu"."cliente_id" = "e"."cliente_id")))
  WHERE (("e"."id" = "invitados"."evento_id") AND ("cu"."user_id" = "auth"."uid"())))));



CREATE POLICY "invitados_update_event_admins" ON "public"."invitados" FOR UPDATE USING (("public"."current_user_event_role"("evento_id") = ANY (ARRAY['owner'::"text", 'admin'::"text"]))) WITH CHECK (("public"."current_user_event_role"("evento_id") = ANY (ARRAY['owner'::"text", 'admin'::"text"])));



ALTER TABLE "public"."invitation_album_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitation_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitation_requests_public_insert" ON "public"."invitation_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("status" = 'new'::"text") AND ("assigned_studio_id" IS NULL) AND ("claimed_by" IS NULL) AND ("claimed_at" IS NULL) AND ("converted_invitation_id" IS NULL)));



CREATE POLICY "invitation_requests_sales_operator_delete" ON "public"."invitation_requests" FOR DELETE TO "authenticated" USING ("public"."is_invitta_sales_operator"());



CREATE POLICY "invitation_requests_sales_operator_select" ON "public"."invitation_requests" FOR SELECT TO "authenticated" USING ("public"."is_invitta_sales_operator"());



CREATE POLICY "invitation_requests_sales_operator_update" ON "public"."invitation_requests" FOR UPDATE TO "authenticated" USING ("public"."is_invitta_sales_operator"()) WITH CHECK ("public"."is_invitta_sales_operator"());



ALTER TABLE "public"."invitation_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitta_sales_operators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_can_read_published_invitations" ON "public"."studio_invitations" FOR SELECT TO "anon" USING (("published" = true));



ALTER TABLE "public"."studio_credit_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."studio_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "studio_invitations_delete_members" ON "public"."studio_invitations" FOR DELETE TO "authenticated" USING ("public"."is_invitta_studio_member"("studio_id"));



CREATE POLICY "studio_invitations_insert_members" ON "public"."studio_invitations" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_invitta_studio_member"("studio_id"));



CREATE POLICY "studio_invitations_select_members" ON "public"."studio_invitations" FOR SELECT TO "authenticated" USING ("public"."is_invitta_studio_member"("studio_id"));



CREATE POLICY "studio_invitations_update_members" ON "public"."studio_invitations" FOR UPDATE TO "authenticated" USING ("public"."is_invitta_studio_member"("studio_id")) WITH CHECK ("public"."is_invitta_studio_member"("studio_id"));



ALTER TABLE "public"."studio_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "studio_members_select_own" ON "public"."studio_members" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."studios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "studios_delete_managers" ON "public"."studios" FOR DELETE TO "authenticated" USING ("public"."is_invitta_studio_manager"("id"));



CREATE POLICY "studios_insert_own" ON "public"."studios" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "studios_select_members" ON "public"."studios" FOR SELECT TO "authenticated" USING ("public"."is_invitta_studio_member"("id"));



CREATE POLICY "studios_update_managers" ON "public"."studios" FOR UPDATE TO "authenticated" USING ("public"."is_invitta_studio_manager"("id")) WITH CHECK ("public"."is_invitta_studio_manager"("id"));



CREATE POLICY "templates_select_active_authenticated" ON "public"."invitation_templates" FOR SELECT TO "authenticated" USING (("active" = true));



CREATE POLICY "templates_select_active_public" ON "public"."invitation_templates" FOR SELECT TO "anon" USING (("active" = true));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."activate_studio_invitation_qr"("target_invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."activate_studio_invitation_qr"("target_invitation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_studio_invitation_qr"("target_invitation_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."check_in_vip_guest"("target_guest_id" "uuid", "scanned_token" "text", "checkin_method" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_in_vip_guest"("target_guest_id" "uuid", "scanned_token" "text", "checkin_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_in_vip_guest"("target_guest_id" "uuid", "scanned_token" "text", "checkin_method" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."confirmar_checkin"("p_qr_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirmar_checkin"("p_qr_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_studio_invitation_credit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_studio_invitation_credit"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_invitta_studio"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_invitta_studio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_invitta_studio"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_user_dashboard_events"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_user_dashboard_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_dashboard_events"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_event_role"("target_evento_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_event_role"("target_evento_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_event_role"("target_evento_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_public_invitation_guest"("invitation_slug" "text", "guest_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_public_invitation_guest"("invitation_slug" "text", "guest_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_invitation_guest"("invitation_slug" "text", "guest_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_invitation_guest"("invitation_slug" "text", "guest_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."grant_studio_credits"("target_studio_id" "uuid", "amount" integer, "reason" "text", "note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."grant_studio_credits"("target_studio_id" "uuid", "amount" integer, "reason" "text", "note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_studio_credits"("target_studio_id" "uuid", "amount" integer, "reason" "text", "note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_cliente_member"("target_cliente_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_cliente_member"("target_cliente_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_cliente_member"("target_cliente_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_event_member"("target_evento_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_event_member"("target_evento_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_event_member"("target_evento_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_invitta_sales_operator"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_invitta_sales_operator"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_invitta_sales_operator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_invitta_sales_operator"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_invitta_studio_manager"("target_studio_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_invitta_studio_manager"("target_studio_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_invitta_studio_manager"("target_studio_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_invitta_studio_manager"("target_studio_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_invitta_studio_member"("target_studio_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_invitta_studio_member"("target_studio_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_invitta_studio_member"("target_studio_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_invitta_studio_member"("target_studio_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_my_studio_credit_ledger"("target_studio_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_my_studio_credit_ledger"("target_studio_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_my_studio_credit_ledger"("target_studio_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_studio_credit_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_studio_credit_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_studio_credit_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_studio_credit_ledger"("target_studio_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_studio_credit_ledger"("target_studio_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_studio_credit_ledger"("target_studio_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."provision_my_invitta_studio"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."provision_my_invitta_studio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."provision_my_invitta_studio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_studio_invitation_lifecycle"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_studio_invitation_lifecycle"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_studio_invitation_lifecycle"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."studio_invitation_active_months"("template_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."studio_invitation_active_months"("template_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."studio_invitation_active_months"("template_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."studio_invitation_package_tier"("template_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."studio_invitation_package_tier"("template_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."studio_invitation_package_tier"("template_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."submit_public_invitation_rsvp"("invitation_slug" "text", "guest_token" "text", "attending" boolean, "confirmed_passes" integer, "guest_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_public_invitation_rsvp"("invitation_slug" "text", "guest_token" "text", "attending" boolean, "confirmed_passes" integer, "guest_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_public_invitation_rsvp"("invitation_slug" "text", "guest_token" "text", "attending" boolean, "confirmed_passes" integer, "guest_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_public_invitation_rsvp"("invitation_slug" "text", "guest_token" "text", "attending" boolean, "confirmed_passes" integer, "guest_message" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_studio_invitation_access_config"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_studio_invitation_access_config"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_studio_invitation_event"("target_invitation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_studio_invitation_event"("target_invitation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_studio_invitation_event"("target_invitation_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."accesos" TO "anon";
GRANT ALL ON TABLE "public"."accesos" TO "authenticated";
GRANT ALL ON TABLE "public"."accesos" TO "service_role";



GRANT ALL ON TABLE "public"."checkins" TO "anon";
GRANT ALL ON TABLE "public"."checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."checkins" TO "service_role";



GRANT ALL ON TABLE "public"."cliente_usuarios" TO "anon";
GRANT ALL ON TABLE "public"."cliente_usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."cliente_usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."confirmaciones" TO "anon";
GRANT ALL ON TABLE "public"."confirmaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."confirmaciones" TO "service_role";



GRANT ALL ON TABLE "public"."evento_usuarios" TO "anon";
GRANT ALL ON TABLE "public"."evento_usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."evento_usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."eventos" TO "anon";
GRANT ALL ON TABLE "public"."eventos" TO "authenticated";
GRANT ALL ON TABLE "public"."eventos" TO "service_role";



GRANT ALL ON TABLE "public"."invitados" TO "anon";
GRANT ALL ON TABLE "public"."invitados" TO "authenticated";
GRANT ALL ON TABLE "public"."invitados" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_album_photos" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_requests" TO "anon";
GRANT ALL ON TABLE "public"."invitation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_templates" TO "anon";
GRANT ALL ON TABLE "public"."invitation_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_templates" TO "service_role";



GRANT ALL ON TABLE "public"."invitta_sales_operators" TO "service_role";



GRANT ALL ON TABLE "public"."studio_credit_ledger" TO "anon";
GRANT ALL ON TABLE "public"."studio_credit_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."studio_credit_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."studio_invitations" TO "anon";
GRANT ALL ON TABLE "public"."studio_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."studio_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."studio_members" TO "anon";
GRANT ALL ON TABLE "public"."studio_members" TO "authenticated";
GRANT ALL ON TABLE "public"."studio_members" TO "service_role";



GRANT ALL ON TABLE "public"."studios" TO "anon";
GRANT ALL ON TABLE "public"."studios" TO "authenticated";
GRANT ALL ON TABLE "public"."studios" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";










