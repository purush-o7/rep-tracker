import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldAlert, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PartnerSwitcher } from "../_components/partner-switcher";
import {
  getPartnersWithPermissions,
  resolvePartnerView,
} from "@/lib/data/partners";
import { TodayPlanList } from "./_components/today-plan-list";
import type { ExerciseTargets } from "@/lib/types";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { partners, partnerIds } = await getPartnersWithPermissions(
    supabase,
    user.id
  );
  const { viewingUserId, partnerName, partnerViewRestricted } =
    resolvePartnerView(params, partners, partnerIds, user.id);

  const isPartnerView = viewingUserId !== user.id;

  const header = (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-2xl font-bold">Today</h1>
      {partners.length > 0 && (
        <PartnerSwitcher partners={partners} activePartnerId={params.partner} />
      )}
    </div>
  );

  if (partnerViewRestricted) {
    return (
      <div className="space-y-4">
        {header}
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>{partnerName}</strong> has restricted access to their
            workout data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayOfWeek = now.getDay();

  // Whether the current user may log on the viewed partner's behalf
  let canEdit = true;
  if (isPartnerView) {
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("partner_can_edit_logs")
      .eq("id", viewingUserId)
      .single();
    canEdit = targetProfile?.partner_can_edit_logs ?? false;
  }

  const planPromise = supabase
    .from("daily_plan_items")
    .select("*, workouts(*, workout_tags(tags(*))), workout_logs(workout_sets(count))")
    .eq("user_id", viewingUserId)
    .eq("plan_date", today)
    .order("sort_order");

  // Routines, schedule and targets only apply to your own plan
  const [planResult, routinesResult, scheduleResult] = await Promise.all([
    planPromise,
    // Always the current user's own routines — they can be added to a partner's plan too
    supabase
      .from("workout_groups")
      .select("*, workout_group_items(count)")
      .eq("user_id", user.id)
      .order("name"),
    isPartnerView
      ? Promise.resolve({ data: null })
      : supabase
          .from("weekly_schedule")
          .select("group_id, workout_groups(id, name)")
          .eq("user_id", user.id)
          .eq("day_of_week", dayOfWeek)
          .maybeSingle(),
  ]);

  const planItems = planResult.data ?? [];

  const targetsByKey: Record<string, ExerciseTargets> = {};
  if (!isPartnerView) {
    const sourceGroupIds = [
      ...new Set(
        planItems
          .map((i) => i.source_group_id)
          .filter((id): id is string => !!id)
      ),
    ];
    if (sourceGroupIds.length > 0) {
      const { data: groupItems } = await supabase
        .from("workout_group_items")
        .select("group_id, workout_id, target_sets, target_reps, target_weight_kg")
        .in("group_id", sourceGroupIds);
      for (const gi of groupItems ?? []) {
        targetsByKey[`${gi.group_id}:${gi.workout_id}`] = {
          target_sets: gi.target_sets,
          target_reps: gi.target_reps,
          target_weight_kg: gi.target_weight_kg,
        };
      }
    }
  }

  const scheduledGroup = scheduleResult.data?.workout_groups;
  const group = Array.isArray(scheduledGroup) ? scheduledGroup[0] : scheduledGroup;
  const scheduledRoutine = group ? { id: group.id, name: group.name } : null;

  return (
    <div className="space-y-4">
      {header}
      {isPartnerView && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Viewing <strong>{partnerName}</strong>&apos;s plan
            {canEdit
              ? " — you can log sets for them today."
              : " — view only (they haven't allowed editing)."}
          </AlertDescription>
        </Alert>
      )}
      <TodayPlanList
        key={viewingUserId}
        initialPlanItems={planItems}
        routines={routinesResult.data ?? []}
        targetsByKey={targetsByKey}
        scheduledRoutine={scheduledRoutine}
        viewingUserId={viewingUserId}
        isPartnerView={isPartnerView}
        canEdit={canEdit}
      />
    </div>
  );
}
