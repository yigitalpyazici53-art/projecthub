-- Applications: the applicant creates a pending row and the project owner
-- may only decide it.
--
-- Before: the owner UPDATE policy checked project ownership only and clients
-- held UPDATE on every column, so an owner could rewrite applicant_id and send
-- a forged "accepted" notification and email to any member. INSERT accepted
-- any status. Policies were duplicated (two INSERT, three SELECT, two UPDATE).
--
-- After:
--   INSERT   applicant only, status must be 'pending' (policy + trigger);
--            created_at is set by the server
--   UPDATE   project owner, status column only, pending -> accepted / rejected
-- Existing rows are not modified.

revoke insert, update on public.applications from anon, authenticated;
grant insert (project_id, applicant_id, role, message) on public.applications to authenticated;
grant update (status) on public.applications to authenticated;

drop policy if exists "Authenticated users can apply" on public.applications;
drop policy if exists "applications: applicant insert" on public.applications;
create policy "applications: applicant insert pending"
  on public.applications for insert to authenticated
  with check (applicant_id = (select auth.uid()) and status = 'pending');

drop policy if exists "Applicant or project owner can read applications" on public.applications;
drop policy if exists "applications: applicant read" on public.applications;
drop policy if exists "applications: project owner read" on public.applications;
create policy "applications: applicant or project owner read"
  on public.applications for select to authenticated
  using (
    applicant_id = (select auth.uid())
    or exists (select 1 from public.projects p
               where p.id = applications.project_id and p.owner_id = (select auth.uid()))
  );

drop policy if exists "Project owner can update application status" on public.applications;
drop policy if exists "applications: project owner update" on public.applications;
create policy "applications: project owner decides"
  on public.applications for update to authenticated
  using (exists (select 1 from public.projects p
                 where p.id = applications.project_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.projects p
                      where p.id = applications.project_id and p.owner_id = (select auth.uid())));

create or replace function public.applications_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from 'pending' and auth.uid() is not null then
    raise exception 'An application must start as pending.' using errcode = '42501';
  end if;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists applications_before_insert on public.applications;
create trigger applications_before_insert
  before insert on public.applications
  for each row execute function public.applications_before_insert();

create or replace function public.guard_application_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.project_id is distinct from old.project_id
     or new.applicant_id is distinct from old.applicant_id
     or new.role is distinct from old.role
     or new.message is distinct from old.message
     or new.created_at is distinct from old.created_at then
    raise exception 'Only an application''s status can be changed.' using errcode = '42501';
  end if;
  if auth.uid() is not null and new.status is distinct from old.status
     and not (old.status = 'pending' and new.status in ('accepted', 'rejected')) then
    raise exception 'Only a pending application can be accepted or rejected.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_application_update on public.applications;
create trigger guard_application_update
  before update on public.applications
  for each row execute function public.guard_application_update();

revoke execute on function public.applications_before_insert() from public, anon, authenticated;
revoke execute on function public.guard_application_update() from public, anon, authenticated;
