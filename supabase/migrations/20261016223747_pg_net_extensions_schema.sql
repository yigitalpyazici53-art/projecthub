-- Register pg_net under the extensions schema (Supabase lint 0014). Its
-- functions stay in the "net" schema, so net.http_post callers are unaffected.
-- pg_net isn't relocatable, hence drop + create; no requests were in flight.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
