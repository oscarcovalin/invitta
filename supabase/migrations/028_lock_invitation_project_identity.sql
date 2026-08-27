-- Keep each cloud project tied to one event identity.
-- Changes to ordinary content create versions; changes to event/protagonists
-- must create a separate project.

create or replace function private.invitta2_design_identity(document jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case lower(coalesce(document->>'eventType', 'otro'))
    when 'boda' then concat_ws(
      '|',
      'boda',
      lower(trim(coalesce(document->>'brideName', ''))),
      lower(trim(coalesce(document->>'groomName', '')))
    )
    when 'xv' then concat_ws(
      '|',
      'xv',
      lower(trim(coalesce(document->>'name', '')))
    )
    else concat_ws(
      '|',
      lower(coalesce(document->>'eventType', 'otro')),
      lower(trim(coalesce(document->>'name', '')))
    )
  end;
$$;

revoke all on function private.invitta2_design_identity(jsonb) from public, anon;
grant execute on function private.invitta2_design_identity(jsonb) to authenticated;

create or replace function public.save_invitation_design(
  p_design_id uuid,
  p_expected_version bigint,
  p_config jsonb,
  p_theme_name text,
  p_custom_theme jsonb default '{}'::jsonb
)
returns public.invitation_designs
language plpgsql
set search_path = ''
as $$
declare
  current_project_id uuid;
  current_project_status text;
  current_identity text;
  saved public.invitation_designs;
begin
  if jsonb_typeof(p_config) <> 'object' then
    raise exception 'config must be a JSON object' using errcode = '22023';
  end if;

  select d.project_id, p.status, private.invitta2_design_identity(d.config)
  into current_project_id, current_project_status, current_identity
  from public.invitation_designs d
  join public.invitation_projects p on p.id = d.project_id
  where d.id = p_design_id
    and d.version = p_expected_version
  for update of d;

  if current_project_id is null then
    raise exception 'design version conflict' using errcode = '40001';
  end if;

  if current_project_status = 'archived' then
    raise exception 'archived projects are read-only' using errcode = '55000';
  end if;

  if current_identity is distinct from private.invitta2_design_identity(p_config) then
    raise exception 'project identity change requires a new project'
      using errcode = '22023';
  end if;

  update public.invitation_designs
  set config = p_config,
      theme_name = coalesce(nullif(trim(p_theme_name), ''), theme_name),
      custom_theme = coalesce(p_custom_theme, '{}'::jsonb),
      version = version + 1,
      updated_by = (select auth.uid())
  where id = p_design_id
  returning * into saved;

  insert into public.invitation_design_versions (
    design_id, version, config, theme_name, custom_theme, created_by
  ) values (
    saved.id, saved.version, saved.config, saved.theme_name, saved.custom_theme,
    (select auth.uid())
  );

  update public.invitation_projects
  set updated_at = now()
  where id = current_project_id;

  return saved;
end;
$$;

grant execute on function public.save_invitation_design(
  uuid, bigint, jsonb, text, jsonb
) to authenticated;
