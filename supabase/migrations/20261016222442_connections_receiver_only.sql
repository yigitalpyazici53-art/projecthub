-- Connection requests: only the receiver decides; the sender can only withdraw.
--
-- Before: three UPDATE policies, two of which let the SENDER update the row,
-- so a sender could mark their own request "accepted". Both DELETE policies
-- let either side delete any connection.
--
-- After:
--   UPDATE  receiver only (connections_update_receiver, kept as is)
--   DELETE  sender: own row while still pending (withdraw a request)
--           receiver: rows addressed to them
--   Nobody can rewrite sender_id / receiver_id on an existing row; otherwise
--   a receiver could re-point a request and fabricate an accepted connection.
-- Existing rows are not modified.

drop policy if exists "Users can update own received connections" on public.connections;
drop policy if exists "connections: participant update" on public.connections;

drop policy if exists "connections: participant delete" on public.connections;
drop policy if exists "connections_delete_participants" on public.connections;

create policy "connections: sender withdraws pending"
  on public.connections for delete to authenticated
  using (sender_id = auth.uid() and status = 'pending');

create policy "connections: receiver deletes"
  on public.connections for delete to authenticated
  using (receiver_id = auth.uid());

create or replace function public.guard_connection_parties()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sender_id is distinct from old.sender_id or new.receiver_id is distinct from old.receiver_id then
    raise exception 'A connection''s sender and receiver cannot be changed.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_connection_parties on public.connections;
create trigger guard_connection_parties
  before update on public.connections
  for each row execute function public.guard_connection_parties();

revoke execute on function public.guard_connection_parties() from public, anon, authenticated;
