-- unsubscribe_email: fail closed when the expected token is unavailable.
--
-- Before: "p_token <> public.email_unsubscribe_token(p_user)" is NULL when the
-- token function returns NULL (e.g. the email_unsubscribe_secret Vault secret
-- is missing), so the check was skipped and any token unsubscribed any user.
--
-- After: a NULL expected token returns false, and the comparison uses
-- IS DISTINCT FROM so a NULL can never pass it.

create or replace function public.unsubscribe_email(p_user uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected text;
begin
  if p_user is null or p_token is null then
    return false;
  end if;
  v_expected := public.email_unsubscribe_token(p_user);
  if v_expected is null or p_token is distinct from v_expected then
    return false;
  end if;
  update public.profiles set email_notifications = false where id = p_user;
  return found;
end;
$$;
