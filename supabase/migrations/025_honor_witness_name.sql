-- 025_honor_witness_name.sql
-- Agrega columna para el testigo de honor en invitaciones de boda

alter table public.studio_invitations
  add column if not exists honor_witness_name text;

comment on column public.studio_invitations.honor_witness_name is 'Nombre del testigo de honor para bodas';
