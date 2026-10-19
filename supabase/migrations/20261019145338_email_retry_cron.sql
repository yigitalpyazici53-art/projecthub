-- Retry emails that never left the queue.
--
-- A row stays 'queued' only if pg_net's call never reached the Edge Function
-- (the function claims queued → sending on arrival). Every 10 minutes pg_cron
-- re-posts rows that have sat queued for 10+ minutes since their last attempt.
-- The original send is attempt 1; after the 3rd attempt a still-queued row is
-- marked 'failed'. Failed rows already don't count toward the rate limits
-- (enqueue_notification_email filters status <> 'failed').
--
-- Re-posting is safe: the Edge Function claims a row exactly once, and Resend
-- de-duplicates on the email_log id.

create extension if not exists pg_cron with schema pg_catalog;

alter table public.email_log
  add column if not exists attempts integer not null default 1,
  add column if not exists last_attempt_at timestamptz not null default now();

-- Existing rows: their only attempt was at creation.
update public.email_log set last_attempt_at = created_at where last_attempt_at <> created_at;

create index if not exists email_log_queued_idx on public.email_log (last_attempt_at) where status = 'queued';

create or replace function public.retry_queued_emails()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_retried integer := 0;
  v_failed integer := 0;
begin
  for v_row in
    select id, attempts from public.email_log
    where status = 'queued' and last_attempt_at < now() - interval '10 minutes'
    order by last_attempt_at
    for update skip locked
  loop
    if v_row.attempts >= 3 then
      update public.email_log
      set status = 'failed', error = 'not delivered to the Edge Function after 3 attempts'
      where id = v_row.id;
      v_failed := v_failed + 1;
    else
      update public.email_log
      set attempts = attempts + 1, last_attempt_at = now()
      where id = v_row.id;
      perform net.http_post(
        url := 'https://hsimrgwjxxhsksdccrrm.supabase.co/functions/v1/send-notification-email',
        body := jsonb_build_object('email_log_id', v_row.id),
        headers := jsonb_build_object('Content-Type', 'application/json'),
        timeout_milliseconds := 10000
      );
      v_retried := v_retried + 1;
    end if;
  end loop;
  return jsonb_build_object('retried', v_retried, 'failed', v_failed);
end;
$$;

revoke execute on function public.retry_queued_emails() from public, anon, authenticated;

select cron.unschedule('retry-queued-emails') where exists (select 1 from cron.job where jobname = 'retry-queued-emails');
select cron.schedule('retry-queued-emails', '*/10 * * * *', 'select public.retry_queued_emails()');
