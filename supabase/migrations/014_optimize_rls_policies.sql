-- =============================================================
-- Migration 014: Optimize RLS policies
-- Fixes: auth_rls_initplan, multiple_permissive_policies,
--        duplicate index, remaining old-style super admin checks
-- =============================================================

-- 1. Drop duplicate index (profiles_handle_key kept from UNIQUE constraint)
DROP INDEX IF EXISTS idx_profiles_handle;

-- =============================================================
-- 2. PROFILES - Fix initplan + scope roles
-- =============================================================

DROP POLICY "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY "Super admin can read all profiles" ON public.profiles;
CREATE POLICY "Super admin can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY "Partners can read partner profiles" ON public.profiles;
CREATE POLICY "Partners can read partner profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_partners
      WHERE workout_partners.status = 'accepted'
        AND (
          (workout_partners.requester_id = (select auth.uid()) AND workout_partners.addressee_id = profiles.id)
          OR (workout_partners.addressee_id = (select auth.uid()) AND workout_partners.requester_id = profiles.id)
        )
    )
  );

-- "Authenticated users can view public profiles" already scoped to authenticated, no auth.uid() used

-- =============================================================
-- 3. WORKOUTS - Fix super admin to use is_super_admin(), scope roles
-- =============================================================

DROP POLICY "Super admin can manage workouts" ON public.workouts;
CREATE POLICY "Super admin can manage workouts"
  ON public.workouts FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- =============================================================
-- 4. TAGS - Fix super admin, scope roles
-- =============================================================

DROP POLICY "Super admin can manage tags" ON public.tags;
CREATE POLICY "Super admin can manage tags"
  ON public.tags FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- =============================================================
-- 5. WORKOUT_TAGS - Fix super admin, scope roles
-- =============================================================

DROP POLICY "Super admin can manage workout_tags" ON public.workout_tags;
CREATE POLICY "Super admin can manage workout_tags"
  ON public.workout_tags FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- =============================================================
-- 6. WORKOUT_IMAGES - Fix super admin, scope roles
-- =============================================================

DROP POLICY "Super admin can manage workout_images" ON public.workout_images;
CREATE POLICY "Super admin can manage workout_images"
  ON public.workout_images FOR ALL
  TO authenticated
  USING (public.is_super_admin());

-- =============================================================
-- 7. WORKOUT_LOGS - Fix initplan + scope roles
-- =============================================================

DROP POLICY "Users can manage own workout_logs" ON public.workout_logs;
CREATE POLICY "Users can manage own workout_logs"
  ON public.workout_logs FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY "Super admin can read all workout_logs" ON public.workout_logs;
CREATE POLICY "Super admin can read all workout_logs"
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY "Partners can read partner workout_logs" ON public.workout_logs;
CREATE POLICY "Partners can read partner workout_logs"
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_partners wp
      JOIN profiles p ON p.id = workout_logs.user_id
      WHERE wp.status = 'accepted'
        AND p.partner_can_view_logs = true
        AND (
          (wp.requester_id = (select auth.uid()) AND wp.addressee_id = workout_logs.user_id)
          OR (wp.addressee_id = (select auth.uid()) AND wp.requester_id = workout_logs.user_id)
        )
    )
  );

DROP POLICY "Partners can insert partner workout_logs" ON public.workout_logs;
CREATE POLICY "Partners can insert partner workout_logs"
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) != user_id
    AND EXISTS (
      SELECT 1 FROM workout_partners wp
      JOIN profiles p ON p.id = workout_logs.user_id
      WHERE wp.status = 'accepted'
        AND p.partner_can_edit_logs = true
        AND (
          (wp.requester_id = (select auth.uid()) AND wp.addressee_id = workout_logs.user_id)
          OR (wp.addressee_id = (select auth.uid()) AND wp.requester_id = workout_logs.user_id)
        )
    )
  );

-- =============================================================
-- 8. WORKOUT_SETS - Fix initplan + scope roles
-- =============================================================

DROP POLICY "Users can manage own workout_sets" ON public.workout_sets;
CREATE POLICY "Users can manage own workout_sets"
  ON public.workout_sets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = workout_sets.log_id
        AND workout_logs.user_id = (select auth.uid())
    )
  );

DROP POLICY "Super admin can read all workout_sets" ON public.workout_sets;
CREATE POLICY "Super admin can read all workout_sets"
  ON public.workout_sets FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY "Partners can read partner workout_sets" ON public.workout_sets;
CREATE POLICY "Partners can read partner workout_sets"
  ON public.workout_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      JOIN workout_partners wp ON wp.status = 'accepted'
        AND (
          (wp.requester_id = (select auth.uid()) AND wp.addressee_id = wl.user_id)
          OR (wp.addressee_id = (select auth.uid()) AND wp.requester_id = wl.user_id)
        )
      JOIN profiles p ON p.id = wl.user_id
      WHERE wl.id = workout_sets.log_id
        AND p.partner_can_view_logs = true
    )
  );

DROP POLICY "Partners can insert partner workout_sets" ON public.workout_sets;
CREATE POLICY "Partners can insert partner workout_sets"
  ON public.workout_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs wl
      JOIN workout_partners wp ON wp.status = 'accepted'
        AND (
          (wp.requester_id = (select auth.uid()) AND wp.addressee_id = wl.user_id)
          OR (wp.addressee_id = (select auth.uid()) AND wp.requester_id = wl.user_id)
        )
      JOIN profiles p ON p.id = wl.user_id
      WHERE wl.id = workout_sets.log_id
        AND p.partner_can_edit_logs = true
    )
  );

-- =============================================================
-- 9. WORKOUT_PARTNERS - Fix initplan + scope roles
-- =============================================================

DROP POLICY "Users can read own partnerships" ON public.workout_partners;
CREATE POLICY "Users can read own partnerships"
  ON public.workout_partners FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = requester_id OR (select auth.uid()) = addressee_id);

DROP POLICY "Users can create partnership requests" ON public.workout_partners;
CREATE POLICY "Users can create partnership requests"
  ON public.workout_partners FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = requester_id);

DROP POLICY "Addressee can update partnership status" ON public.workout_partners;
CREATE POLICY "Addressee can update partnership status"
  ON public.workout_partners FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = addressee_id);

DROP POLICY "Users can delete own partnerships" ON public.workout_partners;
CREATE POLICY "Users can delete own partnerships"
  ON public.workout_partners FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = requester_id OR (select auth.uid()) = addressee_id);

DROP POLICY "Super admin can read all partnerships" ON public.workout_partners;
CREATE POLICY "Super admin can read all partnerships"
  ON public.workout_partners FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
