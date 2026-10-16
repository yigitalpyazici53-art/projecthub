-- Defence in depth: RLS already hides every row; also drop the default
-- table grants so clients can't even attempt to read or write the log.
revoke all on table public.email_log from anon, authenticated;
