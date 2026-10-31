-- /apply: bounded field lengths and at most one application per email per
-- 24 hours.
--
-- Before: anyone with the anon key could insert rows of any size, as often as
-- they liked, and set status, admin_notes, decided_at and created_at.
--
-- After: length CHECKs mirror the form's maxLength (app/apply/page.tsx), the
-- insert trigger sets the review fields itself, and a second application from
-- the same email within 24 hours is refused. Existing rows already fit.

alter table public.builder_applications
  add constraint builder_applications_full_name_len check (char_length(full_name) between 1 and 100),
  add constraint builder_applications_email_len check (char_length(email) between 3 and 254),
  add constraint builder_applications_university_len check (char_length(university) <= 120),
  add constraint builder_applications_role_len check (char_length(role) <= 100),
  add constraint builder_applications_skills_len check (char_length(skills) <= 300),
  add constraint builder_applications_project_name_len check (char_length(project_name) <= 120),
  add constraint builder_applications_what_building_len check (char_length(what_building) <= 2000),
  add constraint builder_applications_looking_for_roles_len check (char_length(looking_for_roles) <= 300),
  add constraint builder_applications_github_url_len check (char_length(github_url) <= 300),
  add constraint builder_applications_linkedin_url_len check (char_length(linkedin_url) <= 300),
  add constraint builder_applications_demo_url_len check (char_length(demo_url) <= 300),
  add constraint builder_applications_why_join_len check (char_length(why_join) <= 2000),
  add constraint builder_applications_policy_version_len check (char_length(policy_version) <= 32),
  add constraint builder_applications_admin_notes_len check (char_length(admin_notes) <= 5000);

create index if not exists builder_applications_email_created_idx
  on public.builder_applications (lower(email), created_at);

-- Replaces the consent stamp trigger: it now also owns the review fields and
-- the per-email limit. Security definer so it can count rows anon cannot read.
create or replace function public.builder_applications_stamp_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.consented_at := now();
  new.created_at := now();
  new.status := 'new';
  new.admin_notes := null;
  new.decided_at := null;

  perform pg_advisory_xact_lock(hashtextextended('apply:' || lower(new.email), 0));
  if exists (select 1 from public.builder_applications
             where lower(email) = lower(new.email) and created_at > now() - interval '24 hours') then
    raise exception 'You have already applied with this email in the last 24 hours.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.builder_applications_stamp_consent() from public, anon, authenticated;
