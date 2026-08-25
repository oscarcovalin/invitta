-- Declarative visibility for optional, template-native invitation sections.
-- An absent key is treated as visible, preserving every existing invitation.

alter table public.studio_invitations
  add column if not exists section_visibility jsonb not null default '{}'::jsonb;

comment on column public.studio_invitations.section_visibility is
  'Optional public sections enabled per invitation. Keys: family, locations, itinerary, gallery, registry, rsvp, music.';
