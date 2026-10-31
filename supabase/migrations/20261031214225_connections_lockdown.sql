-- Connections: a request is created pending by its sender and only the
-- receiver answers it.
--
-- Before: no CHECK on status and three duplicate INSERT policies with no
-- status predicate, so a sender could insert a row already 'accepted' and
-- message the receiver without their consent. Clients could also write every
-- column on INSERT and UPDATE.
--
-- After:
--   status   NOT NULL, one of pending / accepted / rejected
--   INSERT   sender only, status must be 'pending' (policy + trigger);
--            created_at is set by the server
--   UPDATE   receiver only, pending -> accepted / rejected, status column only
--   SELECT   one participant policy instead of three
-- Existing rows are not modified.

alter table public.connections alter column status set not null;
alter table public.connections
  add constraint connections_status_check check (status in ('pending', 'accepted', 'rejected'));

-- Column grants: clients may only send the request fields and answer it.
revoke insert, update on public.connections from anon, authenticated;
grant insert (sender_id, receiver_id, project_id, message) on public.connections to authenticated;
grant update (status) on public.connections to authenticated;

drop policy if exists "Users can insert own connections" on public.connections;
drop policy if exists "connections: sender insert" on public.connections;
drop policy if exists "connections_insert_as_sender" on public.connections;
create policy "connections: sender insert pending"
  on public.connections for insert to authenticated
  with check (sender_id = (select auth.uid()) and receiver_id <> sender_id and status = 'pending');

drop policy if exists "Users can view own connections" on public.connections;
drop policy if exists "connections: participant read" on public.connections;
drop policy if exists "connections_select_participants" on public.connections;
create policy "connections: participant read"
  on public.connections for select to authenticated
  using ((select auth.uid()) in (sender_id, receiver_id));

drop policy if exists "connections_update_receiver" on public.connections;
create policy "connections: receiver answers pending"
  on public.connections for update to authenticated
  using (receiver_id = (select auth.uid()) and status = 'pending')
  with check (receiver_id = (select auth.uid()) and status in ('accepted', 'rejected'));

create or replace function public.connections_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from 'pending' and auth.uid() is not null then
    raise exception 'A connection request must start as pending.' using errcode = '42501';
  end if;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists connections_before_insert on public.connections;
create trigger connections_before_insert
  before insert on public.connections
  for each row execute function public.connections_before_insert();

revoke execute on function public.connections_before_insert() from public, anon, authenticated;

-- Only status may change, and a signed-in user may only answer a pending
-- request. project_id may become null: that is ON DELETE SET NULL when the
-- project is deleted.
create or replace function public.guard_connection_parties()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sender_id is distinct from old.sender_id or new.receiver_id is distinct from old.receiver_id then
    raise exception 'A connection''s sender and receiver cannot be changed.' using errcode = '42501';
  end if;
  if new.id is distinct from old.id
     or new.message is distinct from old.message
     or new.created_at is distinct from old.created_at
     or (new.project_id is distinct from old.project_id and new.project_id is not null) then
    raise exception 'Only a connection''s status can be changed.' using errcode = '42501';
  end if;
  if auth.uid() is not null and new.status is distinct from old.status
     and not (old.status = 'pending' and new.status in ('accepted', 'rejected')) then
    raise exception 'Only a pending request can be accepted or rejected.' using errcode = '42501';
  end if;
  return new;
end;
$$;
