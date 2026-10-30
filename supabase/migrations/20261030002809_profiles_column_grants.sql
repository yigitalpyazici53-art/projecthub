-- Owner-only profile fields are no longer readable through the API.
--
-- Visitors and other members can read the public profile columns only.
-- email_notifications and onboarding_completed_at are read by the owner via
-- my_profile_settings(); the app stopped selecting them in the previous deploy.
--
-- NOTE: a column added to profiles later is NOT readable by anon/authenticated
-- until it is added to this grant list on purpose.

revoke select on public.profiles from anon, authenticated;
grant select (
  id, created_at, full_name, username, university, role, bio, skills, interests,
  github_url, linkedin_url, portfolio_url, avatar_url, is_seed, is_hidden
) on public.profiles to anon, authenticated;
