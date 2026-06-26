-- ════════════════════════════════════════════════════════════════════════════
-- ProjectHub — builder_applications table
--
-- Stores applications from the /apply page (First 100 Builders campaign).
-- Anyone can insert (no auth required).
-- Only the admin user can select — no public read.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists builder_applications (
  id                    uuid        primary key default gen_random_uuid(),
  full_name             text        not null,
  email                 text        not null,
  university            text,
  role                  text,
  skills                text,
  project_name          text,
  what_building         text,
  looking_for_teammates boolean     not null default false,
  looking_for_roles     text,
  github_url            text,
  linkedin_url          text,
  demo_url              text,
  why_join              text,
  status                text        not null default 'new'
                        constraint builder_applications_status_check
                        check (status in ('new', 'reviewed', 'accepted', 'rejected')),
  admin_notes           text,
  created_at            timestamptz not null default now()
);

create index if not exists builder_applications_created_at_idx
  on builder_applications (created_at desc);

alter table builder_applications enable row level security;


-- ── Policies ──────────────────────────────────────────────────────────────────

drop policy if exists "builder_applications: public insert" on builder_applications;
drop policy if exists "builder_applications: admin read"    on builder_applications;

-- Unauthenticated visitors can submit applications.
create policy "builder_applications: public insert"
  on builder_applications for insert
  with check (true);

-- Only the admin account can read applications.
-- The email check uses the signed JWT so it cannot be spoofed by clients.
-- To change the admin email, update this policy and redeploy.
create policy "builder_applications: admin read"
  on builder_applications for select
  using (auth.jwt() ->> 'email' = 'yigitalpyazici53@gmail.com');
