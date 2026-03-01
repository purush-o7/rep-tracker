-- Performance indexes
CREATE INDEX idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX idx_workout_logs_performed_at ON public.workout_logs(performed_at);
CREATE INDEX idx_workout_logs_workout_id ON public.workout_logs(workout_id);
CREATE INDEX idx_workout_sets_log_id ON public.workout_sets(log_id);
CREATE INDEX idx_workout_tags_workout_id ON public.workout_tags(workout_id);
CREATE INDEX idx_workout_tags_tag_id ON public.workout_tags(tag_id);
CREATE INDEX idx_workout_images_workout_id ON public.workout_images(workout_id);
