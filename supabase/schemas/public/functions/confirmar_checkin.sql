create or replace function public.confirmar_checkin (
  p_qr_token text
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
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
$function$;

grant execute on function "public"."confirmar_checkin"(text) to "postgres", "service_role";

revoke all on function "public"."confirmar_checkin"(text) from public;
