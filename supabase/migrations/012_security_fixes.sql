-- Fix SECURITY DEFINER views - recreate as SECURITY INVOKER
-- so they respect the querying user's RLS policies

CREATE OR REPLACE VIEW public.weekly_activity
WITH (security_invoker = true) AS
SELECT
  wl.user_id,
  EXTRACT(DOW FROM wl.performed_at) AS day_of_week,
  TO_CHAR(wl.performed_at, 'Dy') AS day_name,
  COUNT(*)::INTEGER AS workout_count
FROM public.workout_logs wl
WHERE wl.performed_at >= date_trunc('week', CURRENT_DATE)
  AND wl.performed_at < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY wl.user_id, EXTRACT(DOW FROM wl.performed_at), TO_CHAR(wl.performed_at, 'Dy');

CREATE OR REPLACE VIEW public.muscle_group_activity
WITH (security_invoker = true) AS
SELECT
  wl.user_id,
  t.name AS tag_name,
  COUNT(*)::INTEGER AS workout_count
FROM public.workout_logs wl
JOIN public.workout_tags wt ON wt.workout_id = wl.workout_id
JOIN public.tags t ON t.id = wt.tag_id
GROUP BY wl.user_id, t.name;

-- Fix mutable search_path on functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;
