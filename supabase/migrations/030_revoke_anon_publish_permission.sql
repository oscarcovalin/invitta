revoke all on function public.publish_invitation_project(uuid, text) from anon;
grant execute on function public.publish_invitation_project(uuid, text) to authenticated;
