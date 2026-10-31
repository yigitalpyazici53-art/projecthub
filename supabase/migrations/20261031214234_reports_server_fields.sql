-- Reports: created_at and status are set by the server.
--
-- Before: clients held INSERT on every column, and the 10-per-day limit
-- counted rows by created_at, so a backdated created_at bypassed it and each
-- extra report emailed the admin. Two concurrent inserts could also both pass
-- the count.
--
-- After: clients may only send the report fields; the trigger stamps
-- created_at = now() and status = 'open', and serialises each reporter's
-- inserts with an advisory lock before counting.

revoke insert on public.reports from authenticated;
grant insert (reporter_id, reported_id, message_id, reason, details) on public.reports to authenticated;

create or replace function public.reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_msg record;
begin
  new.created_at := now();
  new.status := 'open';

  perform pg_advisory_xact_lock(hashtextextended('reports:' || coalesce(new.reporter_id::text, ''), 0));
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
