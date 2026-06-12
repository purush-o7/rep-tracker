import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TodayPlanList } from "./_components/today-plan-list";
import type { ExerciseTargets } from "@/lib/types";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayOfWeek = now.getDay();

  const [planResult, routinesResult, scheduleResult] = await Promise.all([
    // 1. Today's plan items with workout details
    supabase
      .from("daily_plan_items")
      .select("*, workouts(*)")
      .eq("user_id", user.id)
      .eq("plan_date", today)
      .order("sort_order"),

    // 2. User's routines with item count
    supabase
      .from("workout_groups")
      .select("*, workout_group_items(count)")
      .eq("user_id", user.id)
      .order("name"),

    // 3. Routine scheduled for this weekday
    supabase
      .from("weekly_schedule")
      .select("group_id, workout_groups(id, name)")
      .eq("user_id", user.id)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle(),
  ]);

  const planItems = planResult.data ?? [];

  // 4. Targets for plan items that came from a routine
  const sourceGroupIds = [
    ...new Set(
      planItems.map((i) => i.source_group_id).filter((id): id is string => !!id)
    ),
  ];

  const targetsByKey: Record<string, ExerciseTargets> = {};
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

  // Supabase types many-to-one embeds as an array without FK metadata; normalize
  const scheduledGroup = scheduleResult.data?.workout_groups;
  const group = Array.isArray(scheduledGroup) ? scheduledGroup[0] : scheduledGroup;
  const scheduledRoutine = group ? { id: group.id, name: group.name } : null;

  return (
    <div className="space-y-4">
      <TodayPlanList
        initialPlanItems={planItems}
        routines={routinesResult.data ?? []}
        targetsByKey={targetsByKey}
        scheduledRoutine={scheduledRoutine}
      />
    </div>
  );
}
