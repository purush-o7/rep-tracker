import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TodayPlanList } from "./_components/today-plan-list";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  const [planResult, routinesResult] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-4">
      <TodayPlanList
        initialPlanItems={planResult.data ?? []}
        routines={routinesResult.data ?? []}
      />
    </div>
  );
}
