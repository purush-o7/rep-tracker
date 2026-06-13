import { createClient } from "@/lib/supabase/server";
import { WeightGoalCardClient } from "./weight-goal-card-client";

export async function WeightGoalCard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [profileResult, logsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("weight_kg, height_cm, goal_weight_kg, goal_type, goal_start_weight_kg, goal_started_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("body_weight_logs")
      .select("log_date, weight_kg")
      .eq("user_id", userId)
      .order("log_date", { ascending: true })
      .limit(90),
  ]);

  const profile = profileResult.data;
  if (!profile) return null;

  return (
    <WeightGoalCardClient
      profile={{
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        goal_weight_kg: profile.goal_weight_kg
          ? Number(profile.goal_weight_kg)
          : null,
        goal_type: profile.goal_type,
        goal_start_weight_kg: profile.goal_start_weight_kg
          ? Number(profile.goal_start_weight_kg)
          : null,
      }}
      logs={(logsResult.data ?? []).map((l) => ({
        log_date: l.log_date,
        weight_kg: Number(l.weight_kg),
      }))}
    />
  );
}
