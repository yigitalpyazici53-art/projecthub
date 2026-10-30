-- 18+ and policy acknowledgements.
--
-- user_consents: one row per account, stamped with server time by
-- record_consent(). Signup records it right after the account is created;
-- existing accounts are asked once on their next visit (/consent).
-- builder_applications (/apply) stores the same two confirmations per row;
-- the follow-up migration makes both required for new rows.
--
-- The public landing counters are gone, so get_public_stats() and the unused
-- public_connections_count() are dropped.

create table public.user_consents (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age_confirmed_at timestamptz not null,
  policies_accepted_at timestamptz not null,
  policy_version text not null,
  source text not null check (source in ('signup', 'oauth', 'reconsent')),
  updated_at timestamptz not null default now()
);

alter table public.user_consents enable row level security;
revoke all on public.user_consents from anon, authenticated;
grant select on public.user_consents to authenticated;
create policy "user_consents: owner read" on public.user_consents
  for select to authenticated using (user_id = (select auth.uid()));

-- Writes go through here so the timestamps are the server's, not the client's.
create or replace function public.record_consent(p_version text, p_source text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;
  if p_source not in ('signup', 'oauth', 'reconsent') or coalesce(p_version, '') = '' then
    raise exception 'Invalid consent.' using errcode = '22023';
  end if;
  insert into public.user_consents (user_id, age_confirmed_at, policies_accepted_at, policy_version, source)
  values (v_uid, now(), now(), p_version, p_source)
  on conflict (user_id) do update
    set age_confirmed_at = now(), policies_accepted_at = now(),
        policy_version = excluded.policy_version, source = excluded.source, updated_at = now();
end;
$$;
revoke execute on function public.record_consent(text, text) from public, anon;
grant execute on function public.record_consent(text, text) to authenticated;

-- my_profile_settings() gains the consent stamp.
drop function if exists public.my_profile_settings();
create function public.my_profile_settings()
returns table (
  email_notifications boolean,
  onboarding_completed_at timestamptz,
  is_seed boolean,
  is_hidden boolean,
  age_confirmed_at timestamptz,
  policy_version text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.email_notifications, p.onboarding_completed_at, p.is_seed, p.is_hidden,
         c.age_confirmed_at, c.policy_version
  from public.profiles p
  left join public.user_consents c on c.user_id = p.id
  where p.id = (select auth.uid());
$$;
revoke execute on function public.my_profile_settings() from public, anon;
grant execute on function public.my_profile_settings() to authenticated;

-- /apply confirmations.
alter table public.builder_applications
  add column if not exists age_confirmed boolean not null default false,
  add column if not exists policies_accepted boolean not null default false,
  add column if not exists consented_at timestamptz,
  add column if not exists policy_version text;

create or replace function public.builder_applications_stamp_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.consented_at := now();
  return new;
end;
$$;
revoke execute on function public.builder_applications_stamp_consent() from public, anon, authenticated;

create trigger builder_applications_stamp_consent
  before insert on public.builder_applications
  for each row execute function public.builder_applications_stamp_consent();

drop function if exists public.get_public_stats();
drop function if exists public.public_connections_count();
