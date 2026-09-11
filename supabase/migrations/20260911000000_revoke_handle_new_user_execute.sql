-- handle_new_user() only runs as the on_auth_user_created trigger on auth.users.
-- Trigger execution doesn't check EXECUTE, so this only closes the
-- /rest/v1/rpc/handle_new_user endpoint.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
