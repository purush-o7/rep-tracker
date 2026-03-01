-- Workout Partners feature
-- Allows users to partner up: log workouts for each other (today only) and view each other's data

-- Enum for partnership status
CREATE TYPE public.partner_status AS ENUM ('pending', 'accepted', 'rejected');

-- Workout partners table
CREATE TABLE public.workout_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.partner_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT no_self_partner CHECK (requester_id != addressee_id),
  CONSTRAINT unique_partnership UNIQUE (requester_id, addressee_id)
);

-- Indexes
CREATE INDEX idx_workout_partners_requester ON public.workout_partners(requester_id);
CREATE INDEX idx_workout_partners_addressee ON public.workout_partners(addressee_id);
CREATE INDEX idx_workout_partners_status ON public.workout_partners(status);

-- Reuse existing updated_at trigger function
CREATE TRIGGER on_workout_partners_updated
  BEFORE UPDATE ON public.workout_partners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS for workout_partners table
-- ============================================================
ALTER TABLE public.workout_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own partnerships"
  ON public.workout_partners FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create partnership requests"
  ON public.workout_partners FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can update partnership status"
  ON public.workout_partners FOR UPDATE
  USING (auth.uid() = addressee_id);

CREATE POLICY "Users can delete own partnerships"
  ON public.workout_partners FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Super admin can read all partnerships"
  ON public.workout_partners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================
-- Partner access to workout_logs
-- ============================================================

-- Partners can read each other's workout logs
CREATE POLICY "Partners can read partner workout_logs"
  ON public.workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_partners
      WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = workout_logs.user_id)
          OR (addressee_id = auth.uid() AND requester_id = workout_logs.user_id)
        )
    )
  );

-- Partners can insert workout logs for their partner
CREATE POLICY "Partners can insert partner workout_logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (
    auth.uid() != user_id
    AND EXISTS (
      SELECT 1 FROM public.workout_partners
      WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = workout_logs.user_id)
          OR (addressee_id = auth.uid() AND requester_id = workout_logs.user_id)
        )
    )
  );

-- ============================================================
-- Partner access to workout_sets
-- ============================================================

-- Partners can read each other's workout sets
CREATE POLICY "Partners can read partner workout_sets"
  ON public.workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      JOIN public.workout_partners wp ON wp.status = 'accepted'
        AND (
          (wp.requester_id = auth.uid() AND wp.addressee_id = wl.user_id)
          OR (wp.addressee_id = auth.uid() AND wp.requester_id = wl.user_id)
        )
      WHERE wl.id = workout_sets.log_id
    )
  );

-- Partners can insert workout sets for partner's logs
CREATE POLICY "Partners can insert partner workout_sets"
  ON public.workout_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      JOIN public.workout_partners wp ON wp.status = 'accepted'
        AND (
          (wp.requester_id = auth.uid() AND wp.addressee_id = wl.user_id)
          OR (wp.addressee_id = auth.uid() AND wp.requester_id = wl.user_id)
        )
      WHERE wl.id = workout_sets.log_id
    )
  );

-- ============================================================
-- Partner access to profiles (for display names/avatars)
-- ============================================================

CREATE POLICY "Partners can read partner profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_partners
      WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = profiles.id)
          OR (addressee_id = auth.uid() AND requester_id = profiles.id)
        )
    )
  );
