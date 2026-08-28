-- Corrección de permisos para instalaciones que aplicaron la migración 028.
revoke all on function public.publish_invitation_project(uuid, text) from public;
revoke all on function public.get_published_invitation_path(text) from public;
revoke all on function public.publish_invitation_project(uuid, text) from anon;
grant execute on function public.publish_invitation_project(uuid, text) to authenticated;
grant execute on function public.get_published_invitation_path(text) to anon, authenticated;
