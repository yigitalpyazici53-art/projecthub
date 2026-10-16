-- Seed (example) accounts: one reliable flag, and no interactions with them.
--
-- Seed accounts are the auth users whose email ends in @seed.ph.internal.
-- profiles.is_seed / projects.is_seed are derived by triggers on every write,
-- so a client can never set or clear them (unlike is_ai_generated, which the
-- owner-update policy lets users edit). is_ai_generated is left untouched.

alter table public.profiles add column if not exists is_seed boolean not null default false;
alter table public.projects add column if not exists is_seed boolean not null default false;

-- profiles.is_seed follows the auth email.
create or replace function public.profiles_derive_is_seed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.is_seed := exists (
    select 1 from auth.users u
    where u.id = new.id and u.email ilike '%@seed.ph.internal'
  );
  return new;
end;
$$;

drop trigger if exists profiles_derive_is_seed on public.profiles;
create trigger profiles_derive_is_seed
  before insert or update on public.profiles
  for each row execute function public.profiles_derive_is_seed();

-- projects.is_seed follows the owner's profile.
create or replace function public.projects_derive_is_seed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.is_seed := coalesce(
    (select p.is_seed from public.profiles p where p.id = new.owner_id),
    false
  );
  return new;
end;
$$;

drop trigger if exists projects_derive_is_seed on public.projects;
create trigger projects_derive_is_seed
  before insert or update on public.projects
  for each row execute function public.projects_derive_is_seed();

-- Trigger-only functions: not callable over the API.
revoke execute on function public.profiles_derive_is_seed() from public, anon, authenticated;
revoke execute on function public.projects_derive_is_seed() from public, anon, authenticated;

-- Backfill: the triggers compute the value, so a no-op update is enough.
update public.profiles set is_seed = is_seed;
update public.projects set is_seed = is_seed;

create index if not exists profiles_is_seed_idx on public.profiles (is_seed);
create index if not exists projects_is_seed_idx on public.projects (is_seed);

-- Server-side guard. RESTRICTIVE policies are AND-ed with the existing
-- permissive insert policies, which stay exactly as they are.
drop policy if exists "connections: not to seed accounts" on public.connections;
create policy "connections: not to seed accounts"
  on public.connections as restrictive for insert to authenticated
  with check (not exists (select 1 from public.profiles p where p.id = receiver_id and p.is_seed));

drop policy if exists "messages: not to seed accounts" on public.messages;
create policy "messages: not to seed accounts"
  on public.messages as restrictive for insert to authenticated
  with check (not exists (select 1 from public.profiles p where p.id = receiver_id and p.is_seed));

drop policy if exists "applications: not to seed projects" on public.applications;
create policy "applications: not to seed projects"
  on public.applications as restrictive for insert to authenticated
  with check (not exists (select 1 from public.projects pr where pr.id = project_id and pr.is_seed));
