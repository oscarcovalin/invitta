-- Controls which semantic areas use an invitation's optional custom font.

alter table public.studio_invitations
  add column if not exists custom_font_targets text[]
  not null default array['titles', 'subtitles', 'names']::text[];

comment on column public.studio_invitations.custom_font_targets is
  'Allowed custom font areas: titles, subtitles, names and body.';
