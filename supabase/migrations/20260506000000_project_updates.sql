-- ════════════════════════════════════════════════════════════════════════════
-- ProjectHub — project_updates table
--
-- Owners post short (≤ 280 char) progress updates on their projects.
-- Anyone can read; only the project owner can insert/delete.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists project_updates (
  id         uuid        primary key default gen_random_uuid(),
  project_id uuid        not null references projects(id)  on delete cascade,
  author_id  uuid        not null references profiles(id)  on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now(),
  constraint project_updates_content_length check (char_length(content) <= 280)
);

-- Fast per-project lookups, newest first
create index if not exists project_updates_project_id_created_at_idx
  on project_updates (project_id, created_at desc);

alter table project_updates enable row level security;


-- ── Policies ──────────────────────────────────────────────────────────────────

drop policy if exists "project_updates: public read"  on project_updates;
drop policy if exists "project_updates: owner insert" on project_updates;
drop policy if exists "project_updates: owner delete" on project_updates;

-- Anyone (incl. anon) can read updates for any project
create policy "project_updates: public read"
  on project_updates for select
  using (true);

-- Only the project owner may post updates (and must be the author)
create policy "project_updates: owner insert"
  on project_updates for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from projects
      where projects.id    = project_updates.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- Owner may delete their own updates
create policy "project_updates: owner delete"
  on project_updates for delete
  using (auth.uid() = author_id);
