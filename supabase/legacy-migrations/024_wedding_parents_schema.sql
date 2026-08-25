-- FASE — PADRES COMPLETOS PARA INVITACIONES DE BODA
-- Adds explicit parent columns for bride and groom to public.studio_invitations.
-- All columns are optional and default to null.

alter table public.studio_invitations
  add column if not exists bride_father_name text,
  add column if not exists bride_mother_name text,
  add column if not exists groom_father_name text,
  add column if not exists groom_mother_name text;

comment on column public.studio_invitations.bride_father_name is
  'Optional name of the bride''s father for wedding invitations.';

comment on column public.studio_invitations.bride_mother_name is
  'Optional name of the bride''s mother for wedding invitations.';

comment on column public.studio_invitations.groom_father_name is
  'Optional name of the groom''s father for wedding invitations.';

comment on column public.studio_invitations.groom_mother_name is
  'Optional name of the groom''s mother for wedding invitations.';
