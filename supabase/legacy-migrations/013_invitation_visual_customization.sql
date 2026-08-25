-- Optional visual overrides for an individual invitation.
-- Existing invitations remain untouched because every new value is nullable
-- or defaults to the original design.

alter table public.studio_invitations
  add column if not exists palette_preset text not null default 'original',
  add column if not exists title_color text,
  add column if not exists body_color text,
  add column if not exists accent_color text;

comment on column public.studio_invitations.palette_preset is
  'Curated invitation palette. original preserves the template defaults.';

comment on column public.studio_invitations.title_color is
  'Optional curated title color override as a hexadecimal value.';

comment on column public.studio_invitations.body_color is
  'Optional curated body text color override as a hexadecimal value.';

comment on column public.studio_invitations.accent_color is
  'Optional curated accent color override as a hexadecimal value.';
