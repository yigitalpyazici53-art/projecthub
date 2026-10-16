-- Onboarding state, username rules for new accounts, and builder counts.

-- 1. Onboarding ----------------------------------------------------------------
-- Null means "send to /onboarding once". The app stamps it when the user
-- finishes or skips the flow. Existing builders who already have a project,
-- and seed accounts, are treated as done.
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

update public.profiles p
set onboarding_completed_at = now()
where p.onboarding_completed_at is null
  and (p.is_seed or exists (select 1 from public.projects pr where pr.owner_id = p.id));

-- 2. Usernames ------------------------------------------------------------------
-- New or changed usernames: 3-30 chars of a-z 0-9 . _ -
-- Existing rows are not rewritten; a row is only checked when its username
-- changes, so "kadir polatcan" can still edit the rest of the profile.
create or replace function public.enforce_username_format()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is not null
     and (tg_op = 'INSERT' or new.username is distinct from old.username)
     and new.username !~ '^[a-z0-9._-]{3,30}$' then
    raise exception 'Username must be 3-30 characters: lowercase letters, numbers, dots, underscores or hyphens.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_username_format on public.profiles;
create trigger enforce_username_format
  before insert or update of username on public.profiles
  for each row execute function public.enforce_username_format();

revoke execute on function public.enforce_username_format() from public, anon, authenticated;

-- The signup trigger used the raw email local part (or metadata), which could
-- contain spaces, "+" or capitals. Normalise it to the same alphabet and keep
-- it unique so the format check above never blocks a signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_base text;
  v_username text;
begin
  v_base := lower(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)));
  v_base := regexp_replace(v_base, '[^a-z0-9._-]+', '_', 'g');
  v_base := trim(both '._-' from v_base);
  v_base := left(v_base, 24);
  if length(v_base) < 3 then
    v_base := v_base || 'builder';
  end if;

  v_username := v_base;
  while exists (select 1 from public.profiles where username = v_username) loop
    v_username := v_base || '_' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_username
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3. Public stats -----------------------------------------------------------------
-- Profiles with no real name (blank or a placeholder like "nil") and no
-- projects are hidden from the builder count. Nothing is deleted.
create or replace function public.get_public_stats()
returns table(builders bigint, projects bigint, connections bigint)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    (select count(*) from public.profiles p
      where lower(trim(coalesce(p.full_name, ''))) not in ('', 'nil', 'null', 'none', 'n/a', 'na', '-')
         or exists (select 1 from public.projects pr where pr.owner_id = p.id))  as builders,
    (select count(*) from public.projects)                                    as projects,
    (select count(*) from public.connections where status = 'accepted')       as connections
$$;
