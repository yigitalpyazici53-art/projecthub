-- Writes that create content or reach other members need the 18+ and policy
-- confirmation on record. Version freshness is enforced by the proxy
-- (POLICY_VERSION in code); the database only requires that the account has
-- confirmed at all, so a policy bump can't lock writes out before deploy.

create or replace function private.has_consented()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_consents c
    where c.user_id = auth.uid()
      and c.age_confirmed_at is not null
      and c.policies_accepted_at is not null
  ) or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_seed
  );
$$;

revoke all on function private.has_consented() from public;
grant execute on function private.has_consented() to authenticated;

create policy "projects: consent required" on public.projects
  as restrictive for insert to authenticated with check (private.has_consented());
create policy "project_updates: consent required" on public.project_updates
  as restrictive for insert to authenticated with check (private.has_consented());
create policy "applications: consent required" on public.applications
  as restrictive for insert to authenticated with check (private.has_consented());
create policy "messages: consent required" on public.messages
  as restrictive for insert to authenticated with check (private.has_consented());
create policy "connections: consent required" on public.connections
  as restrictive for insert to authenticated with check (private.has_consented());
create policy "endorsements: consent required" on public.endorsements
  as restrictive for insert to authenticated with check (private.has_consented());
