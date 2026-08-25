-- Optional custom display font for an individual invitation.
-- The preset remains the fallback when the uploaded font cannot load.

alter table public.studio_invitations
  add column if not exists custom_font_url text,
  add column if not exists custom_font_name text;

comment on column public.studio_invitations.custom_font_url is
  'Public Storage URL for an optional WOFF2, WOFF, TTF or OTF display font.';

comment on column public.studio_invitations.custom_font_name is
  'Studio-facing label for the custom invitation font.';
