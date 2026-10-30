-- Retention, enforced daily by pg_cron:
--   email_log             90 days after it was created
--   builder_applications  12 months after the accept/reject decision
--   reports               12 months after they were filed
-- Messages stay until the account is deleted.

alter table public.builder_applications add column if not exists decided_at timestamptz;

-- Rows already decided start their 12 months now.
update public.builder_applications
set decided_at = now()
where status in ('accepted', 'rejected') and decided_at is null;

create or replace function public.builder_applications_stamp_decision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('accepted', 'rejected') then
    if new.status is distinct from old.status or new.decided_at is null then
      new.decided_at := now();
    end if;
  else
    new.decided_at := null;
  end if;
  return new;
end;
$$;
revoke execute on function public.builder_applications_stamp_decision() from public, anon, authenticated;

create trigger builder_applications_stamp_decision
  before update on public.builder_applications
  for each row execute function public.builder_applications_stamp_decision();

create or replace function public.purge_expired_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.email_log where created_at < now() - interval '90 days';
  delete from public.builder_applications where decided_at < now() - interval '12 months';
  delete from public.reports where created_at < now() - interval '12 months';
end;
$$;
revoke execute on function public.purge_expired_data() from public, anon, authenticated;

select cron.schedule('purge-expired-data', '17 3 * * *', 'select public.purge_expired_data()');
