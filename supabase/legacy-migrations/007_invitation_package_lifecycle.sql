-- Apply package validity to new Studio invitation publications.
-- Existing published invitations intentionally keep NULL dates and remain active.

alter table public.studio_invitations
    add column if not exists published_at timestamptz,
    add column if not exists expires_at timestamptz;

create or replace function public.studio_invitation_active_months(template_id text)
returns integer
language sql
immutable
as $$
    select case public.studio_invitation_package_tier(template_id)
        when 'vip' then 12
        when 'premium' then 4
        else 2
    end;
$$;

create or replace function public.set_studio_invitation_lifecycle()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    should_start_new_period boolean;
    template_changed boolean := false;
begin
    if new.published is not true then
        return new;
    end if;

    if tg_op = 'INSERT' then
        should_start_new_period := true;
    else
        should_start_new_period := old.published is distinct from true
            or new.published_at is null;
        template_changed := new.template_id is distinct from old.template_id;
    end if;

    if should_start_new_period then
        new.published_at := now();
    end if;

    if should_start_new_period
       or template_changed
       or new.expires_at is null then
        new.expires_at := new.published_at
            + make_interval(months => public.studio_invitation_active_months(new.template_id));
    end if;

    return new;
end;
$$;

drop trigger if exists set_studio_invitation_lifecycle_trigger
    on public.studio_invitations;

create trigger set_studio_invitation_lifecycle_trigger
before insert or update of published, template_id
on public.studio_invitations
for each row execute function public.set_studio_invitation_lifecycle();

create index if not exists studio_invitations_expires_at_idx
    on public.studio_invitations (expires_at)
    where published is true and expires_at is not null;

comment on column public.studio_invitations.published_at is
    'Start of the current paid publication period. NULL preserves legacy invitations.';

comment on column public.studio_invitations.expires_at is
    'End of the paid publication period derived from the selected package.';
