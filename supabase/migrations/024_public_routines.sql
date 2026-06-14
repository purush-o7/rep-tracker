-- 024: Public & system routines
-- workout_groups gains public sharing; NULL user_id = system routine.

ALTER TABLE public.workout_groups
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN source_group_id UUID REFERENCES public.workout_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_workout_groups_public ON public.workout_groups(is_public) WHERE is_public;

-- Anyone signed in can read public routines (includes system, user_id IS NULL)
CREATE POLICY "Anyone can read public routines"
  ON public.workout_groups FOR SELECT
  TO authenticated
  USING (is_public = true);

-- ...and the items of public routines (so they can be viewed / copied)
CREATE POLICY "Anyone can read public routine items"
  ON public.workout_group_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_groups g
      WHERE g.id = workout_group_items.group_id AND g.is_public = true
    )
  );
