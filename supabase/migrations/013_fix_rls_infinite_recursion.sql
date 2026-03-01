-- Fix infinite recursion in RLS policies
-- The "Super admin" policies on profiles, workout_logs, workout_partners, workout_sets
-- all query profiles to check role, which triggers profiles RLS again → infinite loop.
-- Fix: create a SECURITY DEFINER function that bypasses RLS for the role check.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Fix profiles super_admin policy
DROP POLICY "Super admin can read all profiles" ON public.profiles;
CREATE POLICY "Super admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

-- Fix workout_logs super_admin policy
DROP POLICY "Super admin can read all workout_logs" ON public.workout_logs;
CREATE POLICY "Super admin can read all workout_logs"
  ON public.workout_logs FOR SELECT
  USING (public.is_super_admin());

-- Fix workout_partners super_admin policy
DROP POLICY "Super admin can read all partnerships" ON public.workout_partners;
CREATE POLICY "Super admin can read all partnerships"
  ON public.workout_partners FOR SELECT
  USING (public.is_super_admin());

-- Fix workout_sets super_admin policy
DROP POLICY "Super admin can read all workout_sets" ON public.workout_sets;
CREATE POLICY "Super admin can read all workout_sets"
  ON public.workout_sets FOR SELECT
  USING (public.is_super_admin());
