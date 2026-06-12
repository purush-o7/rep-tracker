-- 018: Lock down SECURITY DEFINER function execution (security advisor findings)

-- handle_new_user is only ever invoked by the auth.users trigger — nobody needs RPC access
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- is_super_admin is used inside RLS policies, which execute it as the querying role,
-- so `authenticated` must keep EXECUTE. Only revoke from anon/PUBLIC.
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
