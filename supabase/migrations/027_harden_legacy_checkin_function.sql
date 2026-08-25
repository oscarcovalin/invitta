-- Retires public access to the superseded QR check-in RPC.
--
-- The active administrative check-in flow uses check_in_vip_guest(uuid, text, text),
-- which requires an authenticated user with an event role. confirmar_checkin(text)
-- bypassed that authorization and is no longer referenced by the application.
-- Keep the function definition temporarily for a safe, reversible rollout; removing
-- its EXECUTE grants prevents anonymous or authenticated callers from invoking it.

revoke all on function public.confirmar_checkin(text) from public;
revoke all on function public.confirmar_checkin(text) from anon;
revoke all on function public.confirmar_checkin(text) from authenticated;

-- The current check-in RPC performs its own auth and event-role validation.
-- Its browser client is available only to signed-in staff, so anonymous execute
-- permission is unnecessary and can be removed without changing the flow.
revoke all on function public.check_in_vip_guest(uuid, text, text) from anon;

-- These Studio helpers require an authenticated session and are only called
-- after login. They do not participate in public invitation rendering.
revoke all on function public.current_invitta_studio() from anon;
revoke all on function public.current_user_dashboard_events() from anon;
revoke all on function public.provision_my_invitta_studio() from anon;

-- This function is a table trigger, not an RPC endpoint. Trigger invocation
-- continues to work for the owning role after every public API grant is gone.
revoke all on function public.sync_studio_invitation_access_config() from public;
revoke all on function public.sync_studio_invitation_access_config() from anon;
revoke all on function public.sync_studio_invitation_access_config() from authenticated;
