-- 023: Let any user add workouts. NULL created_by = system (the seeded catalog).
ALTER TABLE public.workouts
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_workouts_created_by ON public.workouts(created_by);

-- Authenticated users can add / manage their own custom workouts
-- (system workouts stay editable only by super_admin via the existing policy).
CREATE POLICY "Users can insert own workouts"
  ON public.workouts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can update own workouts"
  ON public.workouts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can delete own workouts"
  ON public.workouts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

-- Users can tag the workouts they created
CREATE POLICY "Users can manage tags on own workouts"
  ON public.workout_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_tags.workout_id AND w.created_by = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_tags.workout_id AND w.created_by = (select auth.uid())
    )
  );
