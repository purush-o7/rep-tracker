-- 022: Per-exercise recommended set/rep scheme (the "4 × 10–12" tagline)
-- default_reps is free text so it can hold ranges, "each side", "45 sec", etc.
ALTER TABLE public.workouts
  ADD COLUMN default_sets SMALLINT CHECK (default_sets IS NULL OR (default_sets > 0 AND default_sets <= 20)),
  ADD COLUMN default_reps TEXT;
