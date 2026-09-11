-- Keep the policies defined in 20260429000000_public_read_policies.sql and drop
-- dashboard-created copies that grant exactly the same access. Anon has no
-- auth.uid(), so the {public}-role owner policies match the {authenticated} ones.

drop policy if exists "profiles_select_public"       on public.profiles;
drop policy if exists "profiles_insert_own"          on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "profiles_update_own"          on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_delete_own"          on public.profiles;

drop policy if exists "projects_select_public"        on public.projects;
drop policy if exists "projects_insert_own"           on public.projects;
drop policy if exists "Users can insert own projects" on public.projects;
drop policy if exists "projects_update_own"           on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "projects_delete_own"           on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;
