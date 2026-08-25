-- Self-service onboarding for new Invitta Studio customers.
-- The function runs only for a signed-in user with a confirmed email and is
-- idempotent, so reopening the confirmation link cannot create duplicates.

create or replace function public.provision_my_invitta_studio()
returns table (studio_id uuid, studio_name text, studio_role text)
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
    requested_name text;
    existing_studio_id uuid;
    existing_studio_name text;
    existing_studio_role text;
begin
    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not exists (
        select 1
        from auth.users
        where id = current_user_id
          and email_confirmed_at is not null
    ) then
        raise exception 'Email confirmation required';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

    select s.id, s.name, sm.role
      into existing_studio_id, existing_studio_name, existing_studio_role
    from public.studios s
    join public.studio_members sm on sm.studio_id = s.id
    where sm.user_id = current_user_id
    order by case sm.role when 'owner' then 0 when 'manager' then 1 else 2 end
    limit 1;

    if existing_studio_id is null then
        select s.id, s.name
          into existing_studio_id, existing_studio_name
        from public.studios s
        where s.user_id = current_user_id
        limit 1;

        if existing_studio_id is not null then
            existing_studio_role := 'owner';
        end if;
    end if;

    requested_name := left(trim(coalesce(
        (select raw_user_meta_data ->> 'studio_name' from auth.users where id = current_user_id),
        ''
    )), 120);

    if requested_name = '' then
        requested_name := left(coalesce(
            (select split_part(email, '@', 1) from auth.users where id = current_user_id),
            'Nuevo Studio'
        ), 120);
    end if;

    if existing_studio_id is null then
        insert into public.studios (user_id, name)
        values (current_user_id, requested_name)
        returning id, name into existing_studio_id, existing_studio_name;
        existing_studio_role := 'owner';
    end if;

    insert into public.studio_members (studio_id, user_id, role)
    values (existing_studio_id, current_user_id, 'owner')
    on conflict on constraint studio_members_pkey do nothing;

    select sm.role into existing_studio_role
    from public.studio_members sm
    where sm.studio_id = existing_studio_id
      and sm.user_id = current_user_id;

    return query
    select existing_studio_id, existing_studio_name, existing_studio_role;
end;
$$;

revoke all on function public.provision_my_invitta_studio() from public;
grant execute on function public.provision_my_invitta_studio() to authenticated;
