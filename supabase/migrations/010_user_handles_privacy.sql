-- User handles, profile privacy & partner permissions
-- Adds handle-based identity, profile visibility, and granular partner access controls

-- ============================================================
-- New columns on profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN handle TEXT UNIQUE,
  ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN partner_can_view_logs BOOLEAN DEFAULT true NOT NULL,
  ADD COLUMN partner_can_edit_logs BOOLEAN DEFAULT true NOT NULL;

-- Handle format constraint: lowercase alphanumeric, dots, underscores, 3-30 chars
ALTER TABLE public.profiles
  ADD CONSTRAINT handle_format CHECK (
    handle ~ '^[a-z0-9_.]{3,30}$'
  );

CREATE UNIQUE INDEX idx_profiles_handle ON public.profiles(handle);

-- ============================================================
-- RLS: Authenticated users can search profiles by handle
-- ============================================================
-- Allows finding any profile that has a handle set.
-- Application code only queries (id, handle, full_name, avatar_url) — no sensitive data exposed.

CREATE POLICY "Authenticated users can search profiles by handle"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (handle IS NOT NULL);

-- ============================================================
-- Update partner RLS on workout_logs to respect partner_can_view_logs
-- ============================================================

DROP POLICY "Partners can read partner workout_logs" ON public.workout_logs;
CREATE POLICY "Partners can read partner workout_logs"
  ON public.workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_partners wp
      JOIN public.profiles p ON p.id = workout_logs.user_id
      WHERE wp.status = 'accepted'
        AND p.partner_can_view_logs = true
        AND (
          (wp.requester_id = auth.uid() AND wp.addressee_id = workout_logs.user_id)
          OR (wp.addressee_id = auth.uid() AND wp.requester_id = workout_logs.user_id)
        )
    )
  );

-- ============================================================
-- Update partner RLS on workout_logs INSERT to respect partner_can_edit_logs
-- ============================================================

DROP POLICY "Partners can insert partner workout_logs" ON public.workout_logs;
CREATE POLICY "Partners can insert partner workout_logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (
    auth.uid() != user_id
    AND EXISTS (
      SELECT 1 FROM public.workout_partners wp
      JOIN public.profiles p ON p.id = workout_logs.user_id
      WHERE wp.status = 'accepted'
        AND p.partner_can_edit_logs = true
        AND (
          (wp.requester_id = auth.uid() AND wp.addressee_id = workout_logs.user_id)
          OR (wp.addressee_id = auth.uid() AND wp.requester_id = workout_logs.user_id)
        )
    )
  );

-- ============================================================
-- Update partner RLS on workout_sets to respect partner_can_view_logs
-- ============================================================

DROP POLICY "Partners can read partner workout_sets" ON public.workout_sets;
CREATE POLICY "Partners can read partner workout_sets"
  ON public.workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      JOIN public.workout_partners wp ON wp.status = 'accepted'
        AND (
          (wp.requester_id = auth.uid() AND wp.addressee_id = wl.user_id)
          OR (wp.addressee_id = auth.uid() AND wp.requester_id = wl.user_id)
        )
      JOIN public.profiles p ON p.id = wl.user_id
      WHERE wl.id = workout_sets.log_id
        AND p.partner_can_view_logs = true
    )
  );

-- ============================================================
-- Update partner RLS on workout_sets INSERT to respect partner_can_edit_logs
-- ============================================================

DROP POLICY "Partners can insert partner workout_sets" ON public.workout_sets;
CREATE POLICY "Partners can insert partner workout_sets"
  ON public.workout_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      JOIN public.workout_partners wp ON wp.status = 'accepted'
        AND (
          (wp.requester_id = auth.uid() AND wp.addressee_id = wl.user_id)
          OR (wp.addressee_id = auth.uid() AND wp.requester_id = wl.user_id)
        )
      JOIN public.profiles p ON p.id = wl.user_id
      WHERE wl.id = workout_sets.log_id
        AND p.partner_can_edit_logs = true
    )
  );
