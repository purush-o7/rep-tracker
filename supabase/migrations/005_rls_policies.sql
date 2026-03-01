-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own; super_admin reads all
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Super admin can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Workouts: all authenticated read; super_admin manages
CREATE POLICY "Authenticated users can read workouts"
  ON public.workouts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage workouts"
  ON public.workouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Tags: all authenticated read; super_admin manages
CREATE POLICY "Authenticated users can read tags"
  ON public.tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage tags"
  ON public.tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Workout tags: all authenticated read; super_admin manages
CREATE POLICY "Authenticated users can read workout_tags"
  ON public.workout_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage workout_tags"
  ON public.workout_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Workout images: all authenticated read; super_admin manages
CREATE POLICY "Authenticated users can read workout_images"
  ON public.workout_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage workout_images"
  ON public.workout_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Workout logs: users manage own; super_admin reads all
CREATE POLICY "Users can manage own workout_logs"
  ON public.workout_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Super admin can read all workout_logs"
  ON public.workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Workout sets: users manage own (via log); super_admin reads all
CREATE POLICY "Users can manage own workout_sets"
  ON public.workout_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE id = workout_sets.log_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Super admin can read all workout_sets"
  ON public.workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
