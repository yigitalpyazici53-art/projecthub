-- Account deletion.
--
-- Deleting the auth user now removes everything that belongs to it:
--   auth.users → profiles (cascade) → projects, connections, messages,
--   applications, notifications, endorsements, project_updates, blocks,
--   email_log (all cascade); reports keep the row with the user set to null.
-- delete_my_account() deletes the caller's auth user plus any /apply
-- submission made with the same email. The avatar file is removed by the
-- app through the Storage API first (storage rows can't be deleted in SQL).
--
-- New accounts no longer get a username derived from their email address.

-- 1. Foreign keys ----------------------------------------------------------------

alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

alter table public.projects
  add constraint projects_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete cascade;

alter table public.connections
  add constraint connections_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade,
  add constraint connections_receiver_id_fkey foreign key (receiver_id) references public.profiles(id) on delete cascade,
  add constraint connections_project_id_fkey foreign key (project_id) references public.projects(id) on delete set null;

create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists connections_sender_id_idx on public.connections (sender_id);
create index if not exists connections_receiver_id_idx on public.connections (receiver_id);

-- 2. Avatar delete ---------------------------------------------------------------

create policy "Users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]);

-- 3. delete_my_account -----------------------------------------------------------

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not signed in.' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = v_uid and is_seed) then
    raise exception 'Example accounts cannot be deleted here.' using errcode = '42501';
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is not null then
    delete from public.builder_applications where lower(email) = lower(v_email);
  end if;

  delete from auth.users where id = v_uid;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 4. Usernames for new accounts ------------------------------------------------
-- An explicit username in the signup metadata is kept; otherwise the account
-- gets "builder-" plus six random characters and picks its own in onboarding.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_username text;
begin
  v_username := lower(nullif(new.raw_user_meta_data->>'username', ''));
  if v_username is null or v_username !~ '^[a-z0-9._-]{3,30}$'
     or exists (select 1 from public.profiles where lower(username) = v_username) then
    loop
      v_username := 'builder-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
      exit when not exists (select 1 from public.profiles where lower(username) = v_username);
    end loop;
  end if;

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
