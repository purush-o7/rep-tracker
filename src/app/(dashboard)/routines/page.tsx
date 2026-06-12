import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RoutineList } from "./_components/routine-list";
import { WeeklyScheduleCard } from "./_components/weekly-schedule-card";

export const metadata: Metadata = {
  title: "My Routines - GymTracker",
};

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const [groupsResult, scheduleResult] = await Promise.all([
    supabase
      .from("workout_groups")
      .select("*, workout_group_items(*, workouts(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("weekly_schedule").select("*").eq("user_id", userId),
  ]);

  const groups = groupsResult.data ?? [];

  return (
    <div className="space-y-6">
      <RoutineList groups={groups} />
      <WeeklyScheduleCard
        routines={groups.map((g) => ({ id: g.id, name: g.name }))}
        schedule={scheduleResult.data ?? []}
      />
    </div>
  );
}
