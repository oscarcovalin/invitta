-- Optional, invitation-specific supporting copy for native dress-code sections.
-- Empty values deliberately suppress sample wording from the public template.

alter table public.studio_invitations
  add column if not exists dress_code_details text,
  add column if not exists children_note text,
  add column if not exists children_label text;

comment on column public.studio_invitations.dress_code_details is
  'Optional supporting dress-code copy. Empty hides the template sample detail.';

comment on column public.studio_invitations.children_note is
  'Optional explanatory note about children or adult-only attendance.';

comment on column public.studio_invitations.children_label is
  'Optional short children/adults attendance label. Empty hides the badge.';
