-- Optional per-section background images for templates that declare support.
-- Existing invitations keep their current appearance through the empty object default.

alter table public.studio_invitations
  add column if not exists section_backgrounds jsonb not null default '{}'::jsonb;

comment on column public.studio_invitations.section_backgrounds is
  'Optional HTTPS background URLs keyed by supported section: hero, family, locations, gallery, or rsvp.';
