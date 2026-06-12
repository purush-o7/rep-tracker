-- 016: Body weight tracking + transformation goal, routine item targets, weekly schedule
-- =====================================================================================

-- 1. Body weight logs (one entry per user per day, latest wins via upsert)
CREATE TABLE public.body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX idx_body_weight_logs_user_date
  ON public.body_weight_logs (user_id, log_date DESC);

ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own body weight logs"
  ON public.body_weight_logs FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own body weight logs"
  ON public.body_weight_logs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own body weight logs"
  ON public.body_weight_logs FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own body weight logs"
  ON public.body_weight_logs FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 2. Transformation goal on profiles
ALTER TABLE public.profiles
  ADD COLUMN goal_weight_kg NUMERIC(5,2) CHECK (goal_weight_kg IS NULL OR (goal_weight_kg > 0 AND goal_weight_kg < 500)),
  ADD COLUMN goal_type TEXT CHECK (goal_type IS NULL OR goal_type IN ('gain', 'lose')),
  ADD COLUMN goal_start_weight_kg NUMERIC(5,2),
  ADD COLUMN goal_started_at DATE;

-- 3. Per-exercise targets on routine items (prescribed sets x reps @ weight)
ALTER TABLE public.workout_group_items
  ADD COLUMN target_sets SMALLINT CHECK (target_sets IS NULL OR (target_sets > 0 AND target_sets <= 20)),
  ADD COLUMN target_reps SMALLINT CHECK (target_reps IS NULL OR (target_reps > 0 AND target_reps <= 99)),
  ADD COLUMN target_weight_kg NUMERIC(6,2) CHECK (target_weight_kg IS NULL OR (target_weight_kg >= 0 AND target_weight_kg < 1000));

-- 4. Weekly schedule: map a routine to a weekday (0 = Sunday ... 6 = Saturday)
CREATE TABLE public.weekly_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  group_id UUID NOT NULL REFERENCES public.workout_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);

CREATE INDEX idx_weekly_schedule_user ON public.weekly_schedule (user_id);

ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own weekly schedule"
  ON public.weekly_schedule FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own weekly schedule"
  ON public.weekly_schedule FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own weekly schedule"
  ON public.weekly_schedule FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own weekly schedule"
  ON public.weekly_schedule FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
