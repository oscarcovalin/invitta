-- Decorative background image is an optional watermark layer. The values
-- remain nullable/defaulted so existing invitations keep their native design.
alter table public.studio_invitations
  add column if not exists bg_enabled boolean not null default false,
  add column if not exists bg_image_opacity numeric not null default 0.18,
  add column if not exists bg_overlay_enabled boolean not null default true,
  add column if not exists bg_overlay_color text not null default '#000000',
  add column if not exists bg_overlay_opacity numeric not null default 0.35,
  add column if not exists bg_position text not null default 'center',
  add column if not exists bg_size text not null default 'cover',
  add column if not exists bg_blur integer not null default 0;

alter table public.studio_invitations
  drop constraint if exists studio_invitations_bg_image_opacity_range;

alter table public.studio_invitations
  add constraint studio_invitations_bg_image_opacity_range
  check (bg_image_opacity >= 0 and bg_image_opacity <= 0.60);

comment on column public.studio_invitations.bg_image_opacity is
  'Opacity of the decorative image overlay, from 0 to 0.60.';
