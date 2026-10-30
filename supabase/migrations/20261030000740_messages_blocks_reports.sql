-- Messaging safety: connection-only messages, blocking and reports.
--
-- messages
--   INSERT  only between two people with an accepted connection, and never
--           when either side has blocked the other.
--   UPDATE  the receiver may flip `read` and nothing else (column grant);
--           nobody can edit message content.
--   DELETE  a sender may delete their own messages; the receiver may not.
-- blocks    blocker-owned rows. Blocking removes any connection between the
--           two and stops new messages and connection requests (RLS).
-- reports   written by signed-in users, readable only by the admin. Each new
--           report emails the admin through the existing Resend pipeline.

-- RLS helpers live outside the exposed API schema.
create schema if not exists private;
grant usage on schema private to authenticated;

-- 1. Blocks ------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_id_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;
revoke all on public.blocks from anon, authenticated;
grant select, insert, delete on public.blocks to authenticated;

create policy "blocks: owner read" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "blocks: owner insert" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "blocks: owner delete" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- Security definer so the check also sees blocks the caller can't read
-- (the blocked person must not be able to look up who blocked them).
create or replace function private.blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function private.connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.connections
    where status = 'accepted'
      and ((sender_id = a and receiver_id = b) or (sender_id = b and receiver_id = a))
  );
$$;

revoke execute on function private.blocked_between(uuid, uuid) from public, anon;
revoke execute on function private.connected(uuid, uuid) from public, anon;
grant execute on function private.blocked_between(uuid, uuid) to authenticated;
grant execute on function private.connected(uuid, uuid) to authenticated;

-- Blocking ends the connection, so messaging stops at once.
create or replace function public.blocks_end_connection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.connections
  where (sender_id = new.blocker_id and receiver_id = new.blocked_id)
     or (sender_id = new.blocked_id and receiver_id = new.blocker_id);
  return null;
end;
$$;
revoke execute on function public.blocks_end_connection() from public, anon, authenticated;

create trigger blocks_end_connection
  after insert on public.blocks
  for each row execute function public.blocks_end_connection();

-- 2. Messages ------------------------------------------------------------------

drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "messages: sender insert" on public.messages;
create policy "messages: sender insert to connection" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.connected(sender_id, receiver_id)
    and not private.blocked_between(sender_id, receiver_id)
  );

-- Receivers keep "Receivers can mark messages as read"; the column grant
-- limits that to the `read` flag.
drop policy if exists "messages: participant update" on public.messages;
revoke update on public.messages from anon, authenticated;
grant update (read) on public.messages to authenticated;

drop policy if exists "messages: participant delete" on public.messages;
create policy "messages: sender deletes own" on public.messages
  for delete to authenticated using (sender_id = (select auth.uid()));

-- 3. Connection requests -------------------------------------------------------

create policy "connections: not when blocked" on public.connections
  as restrictive for insert to authenticated
  with check (not private.blocked_between(sender_id, receiver_id));

-- 4. Reports -------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_id uuid references public.profiles(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  -- Copy of the reported message, kept even if the sender deletes it.
  message_content text,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'impersonation', 'underage', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id is null or reported_id is null or reporter_id <> reported_id)
);
create index reports_created_at_idx on public.reports (created_at);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant insert on public.reports to authenticated;
grant select, update on public.reports to authenticated;

create policy "reports: reporter insert" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and reported_id is not null and status = 'open');
create policy "reports: admin read" on public.reports
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'yigitalpyazici53@gmail.com');
create policy "reports: admin update" on public.reports
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'yigitalpyazici53@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'yigitalpyazici53@gmail.com');

-- Validate the attached message, snapshot it, and rate-limit reporters.
create or replace function public.reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msg record;
begin
  if (select count(*) from public.reports
      where reporter_id = new.reporter_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Too many reports today. Please email us instead.' using errcode = '42501';
  end if;

  if new.message_id is not null then
    select sender_id, receiver_id, content into v_msg from public.messages where id = new.message_id;
    if not found or v_msg.receiver_id <> new.reporter_id or v_msg.sender_id <> new.reported_id then
      raise exception 'You can only report messages you received from this person.' using errcode = '42501';
    end if;
    new.message_content := v_msg.content;
  else
    new.message_content := null;
  end if;
  return new;
end;
$$;
revoke execute on function public.reports_before_insert() from public, anon, authenticated;

create trigger reports_before_insert
  before insert on public.reports
  for each row execute function public.reports_before_insert();

-- 5. Admin email for new reports ---------------------------------------------

alter table public.email_log drop constraint if exists email_log_kind_check;
alter table public.email_log add constraint email_log_kind_check check (kind = any (array[
  'connection_request', 'connection_accepted', 'application_received', 'application_accepted',
  'application_rejected', 'new_message', 'test', 'report'
]));

-- Reports go to the admin regardless of their notification setting and
-- without the hourly limit (reporters are rate-limited instead).
create or replace function public.enqueue_notification_email(p_user uuid, p_kind text, p_from uuid, p_entity uuid, p_notification uuid, p_message uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eligible boolean;
  v_id uuid;
begin
  -- Real, opted-in recipients only. Seed (example) accounts never get email.
  select (not p.is_seed) and (p.email_notifications or p_kind = 'report') into v_eligible
  from public.profiles p where p.id = p_user;
  if not coalesce(v_eligible, false) then
    return null;
  end if;
  if p_from is not null and p_from = p_user then
    return null;
  end if;

  -- Serialise concurrent events for the same recipient+kind so the checks below can't race.
  perform pg_advisory_xact_lock(hashtext(p_user::text || ':' || p_kind));

  if p_kind = 'new_message' then
    -- One email per conversation per 15 minutes; follow-ups ride along.
    if exists (
      select 1 from public.email_log l
      where l.user_id = p_user and l.kind = 'new_message' and l.from_user_id = p_from
        and l.status <> 'failed' and l.created_at > now() - interval '15 minutes'
    ) then
      return null;
    end if;
  elsif p_kind not in ('test', 'report') then
    -- At most one email per recipient per kind per hour.
    if exists (
      select 1 from public.email_log l
      where l.user_id = p_user and l.kind = p_kind
        and l.status <> 'failed' and l.created_at > now() - interval '1 hour'
    ) then
      return null;
    end if;
  end if;

  insert into public.email_log (user_id, kind, from_user_id, entity_id, notification_id, message_id)
  values (p_user, p_kind, p_from, p_entity, p_notification, p_message)
  returning id into v_id;

  -- pg_net sends after this transaction commits; a rollback sends nothing.
  perform net.http_post(
    url := 'https://hsimrgwjxxhsksdccrrm.supabase.co/functions/v1/send-notification-email',
    body := jsonb_build_object('email_log_id', v_id),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );
  return v_id;
end;
$$;

create or replace function public.email_on_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid;
begin
  begin
    select id into v_admin from auth.users where email = 'yigitalpyazici53@gmail.com';
    if v_admin is not null then
      perform public.enqueue_notification_email(v_admin, 'report', new.reporter_id, new.id, null, null);
    end if;
  exception when others then
    raise warning 'email_on_report: %', sqlerrm;
  end;
  return null;
end;
$$;
revoke execute on function public.email_on_report() from public, anon, authenticated;

create trigger email_on_report
  after insert on public.reports
  for each row execute function public.email_on_report();
