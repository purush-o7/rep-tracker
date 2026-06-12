-- 016: Routines (workout groups), daily plan & streaks
-- Reconstructs schema that existed in the original project but was never
-- committed as a migration file (created ad-hoc in the SQL editor).

-- 1. Streak tracking on profiles
ALTER TABLE public.profiles
  ADD COLUMN current_streak INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN longest_streak INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN last_workout_date DATE;

-- 2. Workout groups (user-defined routines)
CREATE TABLE public.workout_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER on_workout_groups_updated
  BEFORE UPDATE ON public.workout_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_workout_groups_user_id ON public.workout_groups(user_id);

-- 3. Workout group items (exercises within a routine, ordered)
CREATE TABLE public.workout_group_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.workout_groups(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (group_id, workout_id)
);

CREATE INDEX idx_workout_group_items_group_id ON public.workout_group_items(group_id);

-- 4. Daily plan items (Today page agenda)
CREATE TABLE public.daily_plan_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  plan_date DATE DEFAULT CURRENT_DATE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  source_group_id UUID REFERENCES public.workout_groups(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Required by the app's upsert onConflict: "user_id,workout_id,plan_date"
  UNIQUE (user_id, workout_id, plan_date)
);

CREATE INDEX idx_daily_plan_items_user_date ON public.daily_plan_items(user_id, plan_date);

-- 5. RLS
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout_groups"
  ON public.workout_groups FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own workout_group_items"
  ON public.workout_group_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_groups g
      WHERE g.id = workout_group_items.group_id
        AND g.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_groups g
      WHERE g.id = workout_group_items.group_id
        AND g.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can manage own daily_plan_items"
  ON public.daily_plan_items FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
