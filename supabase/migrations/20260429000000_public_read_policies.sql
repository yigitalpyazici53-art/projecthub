-- ════════════════════════════════════════════════════════════════════════════
-- ProjectHub — Row-Level Security policies
--
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).
-- The script is idempotent: each DROP IF EXISTS + CREATE is safe to re-run.
--
-- Design rules
--   • profiles  — anyone can read; only the owner can write their own row.
--   • projects  — anyone can read; only the owner can write their own row.
--   • connections / messages / notifications — private to the participants.
--   • endorsements — anyone can read; authenticated users can write.
--   • applications — private to the applicant and the project owner.
--
-- "Public" here means the anon role (unauthenticated visitors).
-- Email addresses never appear in profiles rows (they live in auth.users).
-- ════════════════════════════════════════════════════════════════════════════


-- ── 0. Enable RLS on all tables (safe to call even if already enabled) ────────

alter table profiles      enable row level security;
alter table projects      enable row level security;
alter table connections   enable row level security;
alter table messages      enable row level security;
alter table notifications enable row level security;
alter table endorsements  enable row level security;
alter table applications  enable row level security;


-- ── 1. profiles ───────────────────────────────────────────────────────────────
-- Public read: any visitor can browse builder profiles.
-- Write: a user may only insert/update/delete their own row (id = auth.uid()).

drop policy if exists "profiles: public read"         on profiles;
drop policy if exists "profiles: owner insert"        on profiles;
drop policy if exists "profiles: owner update"        on profiles;
drop policy if exists "profiles: owner delete"        on profiles;

create policy "profiles: public read"
  on profiles for select
  using (true);

create policy "profiles: owner insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: owner delete"
  on profiles for delete
  using (auth.uid() = id);


-- ── 2. projects ───────────────────────────────────────────────────────────────
-- Public read: any visitor can browse projects.
-- Write: only the project owner (owner_id = auth.uid()).

drop policy if exists "projects: public read"         on projects;
drop policy if exists "projects: owner insert"        on projects;
drop policy if exists "projects: owner update"        on projects;
drop policy if exists "projects: owner delete"        on projects;

create policy "projects: public read"
  on projects for select
  using (true);

create policy "projects: owner insert"
  on projects for insert
  with check (auth.uid() = owner_id);

create policy "projects: owner update"
  on projects for update
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "projects: owner delete"
  on projects for delete
  using (auth.uid() = owner_id);


-- ── 3. connections ────────────────────────────────────────────────────────────
-- Only the two participants (sender or receiver) can see or touch a row.

drop policy if exists "connections: participant read"   on connections;
drop policy if exists "connections: sender insert"      on connections;
drop policy if exists "connections: participant update" on connections;
drop policy if exists "connections: participant delete" on connections;

create policy "connections: participant read"
  on connections for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "connections: sender insert"
  on connections for insert
  with check (auth.uid() = sender_id);

create policy "connections: participant update"
  on connections for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "connections: participant delete"
  on connections for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);


-- ── 4. messages ───────────────────────────────────────────────────────────────
-- Only sender and receiver can see a message; only sender can insert.

drop policy if exists "messages: participant read"   on messages;
drop policy if exists "messages: sender insert"      on messages;
drop policy if exists "messages: participant update" on messages;
drop policy if exists "messages: participant delete" on messages;

create policy "messages: participant read"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages: sender insert"
  on messages for insert
  with check (auth.uid() = sender_id);

create policy "messages: participant update"
  on messages for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages: participant delete"
  on messages for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);


-- ── 5. notifications ──────────────────────────────────────────────────────────
-- Only the target user can see their own notifications.

drop policy if exists "notifications: owner read"   on notifications;
drop policy if exists "notifications: owner update" on notifications;
drop policy if exists "notifications: owner delete" on notifications;

create policy "notifications: owner read"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications: owner update"
  on notifications for update
  using (auth.uid() = user_id);

create policy "notifications: owner delete"
  on notifications for delete
  using (auth.uid() = user_id);


-- ── 6. endorsements ───────────────────────────────────────────────────────────
-- Public read (skills on a profile are public).
-- Authenticated users can endorse others; they manage their own endorsements.

drop policy if exists "endorsements: public read"     on endorsements;
drop policy if exists "endorsements: auth insert"     on endorsements;
drop policy if exists "endorsements: endorser delete" on endorsements;

create policy "endorsements: public read"
  on endorsements for select
  using (true);

create policy "endorsements: auth insert"
  on endorsements for insert
  with check (auth.uid() = endorser_id);

create policy "endorsements: endorser delete"
  on endorsements for delete
  using (auth.uid() = endorser_id);


-- ── 7. applications ───────────────────────────────────────────────────────────
-- Applicant can see and manage their own applications.
-- Project owner can see applications to their projects and update status.

drop policy if exists "applications: applicant read"         on applications;
drop policy if exists "applications: project owner read"     on applications;
drop policy if exists "applications: applicant insert"       on applications;
drop policy if exists "applications: project owner update"   on applications;
drop policy if exists "applications: applicant delete"       on applications;

create policy "applications: applicant read"
  on applications for select
  using (auth.uid() = applicant_id);

create policy "applications: project owner read"
  on applications for select
  using (
    exists (
      select 1 from projects
      where projects.id = applications.project_id
        and projects.owner_id = auth.uid()
    )
  );

create policy "applications: applicant insert"
  on applications for insert
  with check (auth.uid() = applicant_id);

create policy "applications: project owner update"
  on applications for update
  using (
    exists (
      select 1 from projects
      where projects.id = applications.project_id
        and projects.owner_id = auth.uid()
    )
  );

create policy "applications: applicant delete"
  on applications for delete
  using (auth.uid() = applicant_id);
