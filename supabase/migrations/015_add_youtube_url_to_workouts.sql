-- Add YouTube URL column to workouts for exercise tutorial videos
ALTER TABLE public.workouts
  ADD COLUMN youtube_url TEXT;
