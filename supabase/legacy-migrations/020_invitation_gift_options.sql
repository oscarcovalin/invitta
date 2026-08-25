-- Opciones configurables de mesa de regalos y datos bancarios por invitación.
-- Permite hasta 3 opciones de regalo (mesas físicas/online y transferencias bancarias).
-- Las invitaciones existentes conservan su retrocompatibilidad gracias al default '[]'::jsonb
-- y al campo legacy gift_table_url.

alter table public.studio_invitations
  add column if not exists gift_options jsonb not null default '[]'::jsonb;

alter table public.studio_invitations
  drop constraint if exists studio_invitations_gift_options_is_array;

alter table public.studio_invitations
  add constraint studio_invitations_gift_options_is_array
  check (
    jsonb_typeof(gift_options) = 'array'
  );

comment on column public.studio_invitations.gift_options is
  'Configurable gift options for Studio invitations. Supports registry links and bank transfer details. Public invitation render must hide empty/demo gift cards for real Studio invitations.';
