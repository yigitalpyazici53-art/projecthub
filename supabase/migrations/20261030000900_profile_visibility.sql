-- Profile visibility.
--
-- is_hidden: a hidden profile is invisible to signed-out visitors (and so to
-- search engines, the sitemap and OG images, which all read as anon). Signed-in
-- members still see it.
--
-- Owner-only settings (email_notifications, onboarding_completed_at) are read
-- through my_profile_settings(); a follow-up migration removes them from the
-- column grants once the app reads them from there.

alter table public.profiles add column if not exists is_hidden boolean not null default false;

drop policy if exists "profiles: public read" on public.profiles;
create policy "profiles: anon reads visible" on public.profiles
  for select to anon using (not is_hidden);
create policy "profiles: members read" on public.profiles
  for select to authenticated using (true);

-- Profiles are deleted only with the account (delete_my_account), never on
-- their own: a lone profile delete would leave the auth user behind.
drop policy if exists "profiles: owner delete" on public.profiles;

create or replace function public.my_profile_settings()
returns table (email_notifications boolean, onboarding_completed_at timestamptz, is_seed boolean, is_hidden boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.email_notifications, p.onboarding_completed_at, p.is_seed, p.is_hidden
  from public.profiles p
  where p.id = (select auth.uid());
$$;
revoke execute on function public.my_profile_settings() from public, anon;
grant execute on function public.my_profile_settings() to authenticated;
