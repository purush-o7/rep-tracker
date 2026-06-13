-- 020: Let accepted partners view and update each other's daily plan items
-- so a partner can see your Today plan and log/complete sets on your behalf.
-- View respects partner_can_view_logs; update respects partner_can_edit_logs.
-- (workout_logs / workout_sets partner INSERT policies already exist from 010/014.)

CREATE POLICY "Partners can view partner daily_plan_items"
  ON public.daily_plan_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_partners wp
      JOIN public.profiles p ON p.id = daily_plan_items.user_id
      WHERE wp.status = 'accepted'
        AND p.partner_can_view_logs = true
        AND (
          (wp.requester_id = (select auth.uid()) AND wp.addressee_id = daily_plan_items.user_id)
          OR (wp.addressee_id = (select auth.uid()) AND wp.requester_id = daily_plan_items.user_id)
        )
    )
  );

CREATE POLICY "Partners can update partner daily_plan_items"
  ON public.daily_plan_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_partners wp
      JOIN public.profiles p ON p.id = daily_plan_items.user_id
      WHERE wp.status = 'accepted'
        AND p.partner_can_edit_logs = true
        AND (
          (wp.requester_id = (select auth.uid()) AND wp.addressee_id = daily_plan_items.user_id)
          OR (wp.addressee_id = (select auth.uid()) AND wp.requester_id = daily_plan_items.user_id)
        )
    )
  );
