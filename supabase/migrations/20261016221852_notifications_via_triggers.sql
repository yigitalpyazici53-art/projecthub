-- Notifications are created only by the database, from the events they
-- describe. Clients can no longer insert them (the old policies let any
-- signed-in user notify anyone, in anyone's name).
--
--   connections  INSERT (pending)          → receiver: connection_request
--   connections  UPDATE → accepted         → sender:   connection_accepted
--                (only when the receiver accepts; a sender can't fake it)
--   applications INSERT                    → owner:    application_received
--   applications UPDATE → accepted/rejected → applicant: application_accepted/_rejected

create or replace function public.notify_connection_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      insert into public.notifications (user_id, type, from_user_id, entity_id)
      values (new.receiver_id, 'connection_request', new.sender_id, new.id);
    end if;
  elsif new.status = 'accepted'
        and old.status is distinct from 'accepted'
        and (auth.uid() is null or auth.uid() = new.receiver_id) then
    insert into public.notifications (user_id, type, from_user_id, entity_id)
    values (new.sender_id, 'connection_accepted', new.receiver_id, new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists notify_connection_event on public.connections;
create trigger notify_connection_event
  after insert or update of status on public.connections
  for each row execute function public.notify_connection_event();

create or replace function public.notify_application_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner from public.projects where id = new.project_id;
  if v_owner is null then
    return null;
  end if;

  if tg_op = 'INSERT' then
    if v_owner <> new.applicant_id then
      insert into public.notifications (user_id, type, from_user_id, entity_id)
      values (v_owner, 'application_received', new.applicant_id, new.project_id);
    end if;
  elsif new.status in ('accepted', 'rejected') and old.status is distinct from new.status then
    insert into public.notifications (user_id, type, from_user_id, entity_id)
    values (new.applicant_id, 'application_' || new.status, v_owner, new.project_id);
  end if;
  return null;
end;
$$;

drop trigger if exists notify_application_event on public.applications;
create trigger notify_application_event
  after insert or update of status on public.applications
  for each row execute function public.notify_application_event();

revoke execute on function public.notify_connection_event() from public, anon, authenticated;
revoke execute on function public.notify_application_event() from public, anon, authenticated;

-- Close direct inserts. With no INSERT policy left, RLS rejects them; the
-- SECURITY DEFINER triggers above run as the owner and are unaffected.
drop policy if exists "Authenticated users can insert notifications" on public.notifications;
drop policy if exists "Authenticated users insert notifications as themselves" on public.notifications;

-- Endorsements: same seed guard as connections/messages/applications.
drop policy if exists "endorsements: not for seed accounts" on public.endorsements;
create policy "endorsements: not for seed accounts"
  on public.endorsements as restrictive for insert to authenticated
  with check (not exists (select 1 from public.profiles p where p.id = profile_id and p.is_seed));

-- Usernames: unique regardless of case. Checked beforehand: no collisions.
create unique index if not exists profiles_username_lower_key on public.profiles (lower(username));

-- Keep the signup trigger's collision check in step with the index.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_base text;
  v_username text;
begin
  v_base := lower(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)));
  v_base := regexp_replace(v_base, '[^a-z0-9._-]+', '_', 'g');
  v_base := trim(both '._-' from v_base);
  v_base := left(v_base, 24);
  if length(v_base) < 3 then
    v_base := v_base || 'builder';
  end if;

  v_username := v_base;
  while exists (select 1 from public.profiles where lower(username) = v_username) loop
    v_username := v_base || '_' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    v_username
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
