-- Tighten handle search to respect is_public
-- Public profiles are discoverable by all authenticated users.
-- Private profiles are only visible to the owner and their accepted partners.

DROP POLICY "Authenticated users can search profiles by handle" ON public.profiles;

CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    is_public = true AND handle IS NOT NULL
  );
