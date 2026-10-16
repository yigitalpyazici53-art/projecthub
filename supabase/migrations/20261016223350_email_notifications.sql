-- Email notifications, triggered from the same place in-app notifications
-- come from: the database.
--
--   notifications INSERT ─┐
--   messages      INSERT ─┴─> enqueue_notification_email()
--        checks: recipient is real (not is_seed), opted in, not self, rate limits
--        writes  email_log (status 'queued')
--        calls   pg_net → Edge Function send-notification-email (after commit)
--   Edge Function claims the queued row, sends via Resend, records the result.
--
-- All policy (who, when, how often) lives here in SQL, in one transaction
-- with the event itself; the Edge Function only renders and delivers.

create extension if not exists pg_net;

-- 1. Preference ------------------------------------------------------------------
alter table public.profiles add column if not exists email_notifications boolean not null default true;

-- 2. Delivery log (also the rate-limit ledger) -------------------------------------
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in (
    'connection_request', 'connection_accepted',
    'application_received', 'application_accepted', 'application_rejected',
    'new_message', 'test'
  )),
  from_user_id uuid references public.profiles(id) on delete set null,
  entity_id uuid,
  notification_id uuid references public.notifications(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  resend_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_log_user_kind_created_idx on public.email_log (user_id, kind, created_at desc);

-- Service role only: RLS on, no policies.
alter table public.email_log enable row level security;

-- 3. Unsubscribe tokens -------------------------------------------------------------
-- HMAC-SHA256(user_id, secret). The secret is generated here, lives only in
-- Vault, and is never shown to anyone; tokens are stateless and per-user.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'email_unsubscribe_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'email_unsubscribe_secret',
      'HMAC key for one-click email unsubscribe links'
    );
  end if;
end;
$$;

create or replace function public.email_unsubscribe_token(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select encode(
    extensions.hmac(
      p_user::text,
      (select decrypted_secret from vault.decrypted_secrets where name = 'email_unsubscribe_secret'),
      'sha256'
    ),
    'hex'
  );
$$;

-- Only the Edge Function (service role) mints tokens.
revoke execute on function public.email_unsubscribe_token(uuid) from public, anon, authenticated;
grant execute on function public.email_unsubscribe_token(uuid) to service_role;

-- Anyone holding a valid link can turn emails off for that one user, without
-- signing in. Returns false for a bad token.
create or replace function public.unsubscribe_email(p_user uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user is null or p_token is null or p_token <> public.email_unsubscribe_token(p_user) then
    return false;
  end if;
  update public.profiles set email_notifications = false where id = p_user;
  return found;
end;
$$;

revoke execute on function public.unsubscribe_email(uuid, text) from public;
grant execute on function public.unsubscribe_email(uuid, text) to anon, authenticated, service_role;

-- 4. Enqueue --------------------------------------------------------------------------
create or replace function public.enqueue_notification_email(
  p_user uuid,
  p_kind text,
  p_from uuid,
  p_entity uuid,
  p_notification uuid,
  p_message uuid
)
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
  select (not p.is_seed) and p.email_notifications into v_eligible
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
  elsif p_kind <> 'test' then
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

revoke execute on function public.enqueue_notification_email(uuid, text, uuid, uuid, uuid, uuid) from public, anon, authenticated;

-- 5. Triggers ---------------------------------------------------------------------------
-- Email must never break the action that caused it: any failure here is
-- swallowed (with a warning) so the notification / message still saves.
create or replace function public.email_on_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type in ('connection_request', 'connection_accepted', 'application_received',
                  'application_accepted', 'application_rejected') then
    begin
      perform public.enqueue_notification_email(new.user_id, new.type, new.from_user_id, new.entity_id, new.id, null);
    exception when others then
      raise warning 'email_on_notification: %', sqlerrm;
    end;
  end if;
  return null;
end;
$$;

drop trigger if exists email_on_notification on public.notifications;
create trigger email_on_notification
  after insert on public.notifications
  for each row execute function public.email_on_notification();

-- Messages don't create notifications rows, so they get their own trigger.
create or replace function public.email_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    perform public.enqueue_notification_email(new.receiver_id, 'new_message', new.sender_id, null, null, new.id);
  exception when others then
    raise warning 'email_on_message: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists email_on_message on public.messages;
create trigger email_on_message
  after insert on public.messages
  for each row execute function public.email_on_message();

revoke execute on function public.email_on_notification() from public, anon, authenticated;
revoke execute on function public.email_on_message() from public, anon, authenticated;
