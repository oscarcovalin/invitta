-- Optional demo seed.
-- Replace the user_id value with the Supabase Auth user id created for the demo account.

with demo_cliente as (
    insert into public.clientes (nombre, email_contacto, telefono, plan, estado)
    values ('Paulina & Roy', 'paulina@example.com', '555-0100', 'demo', 'activo')
    returning id
),
demo_evento as (
    insert into public.eventos (
        cliente_id,
        nombre,
        tipo,
        slug,
        fecha_evento,
        ubicacion,
        config,
        estado
    )
    select
        id,
        'Boda de Paulina & Roy',
        'boda',
        'paulina-y-roy-2026',
        '2026-11-15 18:00:00-06',
        'Ciudad de Mexico',
        '{"inviteUrl":"https://invittia.com/boda/paulina-y-roy-2026","displayName":"Paulina & Roy"}'::jsonb,
        'activo'
    from demo_cliente
    returning id
)
insert into public.invitados
    (evento_id, qr_token, nombre, familia, estado, pases_asignados, pases_confirmados, mesa, email, telefono, confirmed_at)
select id, 'INV-00001', 'Juan Perez', 'Familia Perez Lopez', 'Confirmado', 3, 3, '12', 'juan@example.com', '555-0101', '2026-08-10'::timestamptz from demo_evento
union all select id, 'INV-00002', 'Maria Gomez', 'Familia Gomez', 'Pendiente', 1, 0, null, 'maria@example.com', '555-0102', null from demo_evento
union all select id, 'INV-00003', 'Carlos Slim', 'Familia Slim', 'Confirmado', 4, 4, '1', 'carlos@example.com', '555-0103', '2026-08-11'::timestamptz from demo_evento
union all select id, 'INV-00004', 'Ana Martinez', 'Familia Martinez', 'No asistirá', 0, 0, null, 'ana@example.com', '555-0104', '2026-08-12'::timestamptz from demo_evento
union all select id, 'INV-00005', 'Roberto Torres', 'Familia Torres', 'Confirmado', 2, 2, '12', 'roberto@example.com', '555-0105', '2026-08-13'::timestamptz from demo_evento
union all select id, 'INV-00006', 'Laura Sanchez', 'Familia Sanchez', 'Pendiente', 2, 0, null, 'laura@example.com', '555-0106', null from demo_evento
union all select id, 'INV-00007', 'Diego Fernandez', 'Familia Fernandez', 'Confirmado', 1, 1, '5', 'diego@example.com', '555-0107', '2026-08-14'::timestamptz from demo_evento
union all select id, 'INV-00008', 'Sofia Ruiz', 'Familia Ruiz', 'Confirmado', 0, 0, '5', 'sofia@example.com', '555-0108', '2026-08-15'::timestamptz from demo_evento;

-- After creating the Auth user, link it manually:
-- insert into public.cliente_usuarios (cliente_id, user_id, rol)
-- values ('<cliente_id>', '<auth_user_id>', 'owner');

Go Live
