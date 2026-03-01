-- Seed muscle group tags
INSERT INTO public.tags (name) VALUES
  ('biceps'),
  ('triceps'),
  ('back'),
  ('legs'),
  ('chest'),
  ('shoulders'),
  ('core'),
  ('cardio'),
  ('glutes'),
  ('forearms'),
  ('full_body')
ON CONFLICT (name) DO NOTHING;
