-- Biblioteca tipográfica por invitación.
-- El cliente conserva temporalmente un respaldo versionado en custom_font_targets
-- para permitir despliegues compatibles mientras esta migración se aplica.

alter table public.studio_invitations
  add column if not exists typography_fonts jsonb not null default '[]'::jsonb;

alter table public.studio_invitations
  drop constraint if exists studio_invitations_typography_fonts_shape;

alter table public.studio_invitations
  add constraint studio_invitations_typography_fonts_shape
  check (
    jsonb_typeof(typography_fonts) = 'array'
    and jsonb_array_length(typography_fonts) <= 4
  );

comment on column public.studio_invitations.typography_fonts is
  'Biblioteca de hasta cuatro fuentes: [{id,name,url}]. Las asignaciones por función permanecen en custom_font_targets.';
