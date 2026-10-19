-- Full health report for /api/health. The route calls this with the anon key,
-- so the token is checked here too: without the right token anon learns
-- nothing. Only a SHA-256 of HEALTH_TOKEN lives in Vault
-- ('health_token_sha256', created outside migrations); the token itself is
-- only in the Vercel env.
create or replace function public.health_report(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  select decrypted_secret into v_hash from vault.decrypted_secrets where name = 'health_token_sha256';
  if v_hash is null or p_token is null
     or encode(extensions.digest(p_token, 'sha256'), 'hex') <> v_hash then
    return null;
  end if;
  return jsonb_build_object(
    'stale_queued_emails',
    (select count(*) from public.email_log where status = 'queued' and created_at < now() - interval '1 hour')
  );
end;
$$;

revoke execute on function public.health_report(text) from public;
grant execute on function public.health_report(text) to anon, authenticated, service_role;
