-- Weekly activity view (workouts per day of week for current week)
CREATE OR REPLACE VIEW public.weekly_activity AS
SELECT
  wl.user_id,
  EXTRACT(DOW FROM wl.performed_at) AS day_of_week,
  TO_CHAR(wl.performed_at, 'Dy') AS day_name,
  COUNT(*)::INTEGER AS workout_count
FROM public.workout_logs wl
WHERE wl.performed_at >= date_trunc('week', CURRENT_DATE)
  AND wl.performed_at < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY wl.user_id, EXTRACT(DOW FROM wl.performed_at), TO_CHAR(wl.performed_at, 'Dy');

-- Muscle group activity view
CREATE OR REPLACE VIEW public.muscle_group_activity AS
SELECT
  wl.user_id,
  t.name AS tag_name,
  COUNT(*)::INTEGER AS workout_count
FROM public.workout_logs wl
JOIN public.workout_tags wt ON wt.workout_id = wl.workout_id
JOIN public.tags t ON t.id = wt.tag_id
GROUP BY wl.user_id, t.name;
