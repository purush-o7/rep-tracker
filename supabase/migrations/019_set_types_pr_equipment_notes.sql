-- 019: Duration/distance set types, PR flag on logs, per-exercise equipment notes

-- 1. How an exercise is logged: reps x weight, time held, or distance covered
ALTER TABLE public.workouts
  ADD COLUMN log_type TEXT NOT NULL DEFAULT 'weight_reps'
    CHECK (log_type IN ('weight_reps', 'duration', 'distance'));

-- 2. Sets can now hold duration (seconds) or distance (meters) instead of reps
ALTER TABLE public.workout_sets
  ALTER COLUMN reps DROP NOT NULL,
  ADD COLUMN duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  ADD COLUMN distance_m INTEGER CHECK (distance_m IS NULL OR distance_m > 0),
  ADD CONSTRAINT workout_sets_has_measure CHECK (
    reps IS NOT NULL OR duration_seconds IS NOT NULL OR distance_m IS NOT NULL
  );

-- 3. Personal record flag, set server-side when a log beats the previous best
ALTER TABLE public.workout_logs
  ADD COLUMN is_pr BOOLEAN NOT NULL DEFAULT false;

-- 4. Sticky per-user equipment notes (seat height, grip, pin settings...)
CREATE TABLE public.user_workout_prefs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  equipment_note TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, workout_id)
);

ALTER TABLE public.user_workout_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout prefs"
  ON public.user_workout_prefs FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
