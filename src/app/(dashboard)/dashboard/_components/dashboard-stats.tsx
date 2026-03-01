import { startOfWeek } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "./stats-cards";

interface DashboardStatsProps {
  userId: string;
}

export async function DashboardStats({ userId }: DashboardStatsProps) {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [weeklyRes, monthlyRes, allLogsRes, profileRes] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("performed_at")
      .eq("user_id", userId)
      .gte("performed_at", weekStart.toISOString()),
    supabase
      .from("workout_logs")
      .select("performed_at")
      .eq("user_id", userId)
      .gte("performed_at", monthStart.toISOString()),
    supabase
      .from("workout_logs")
      .select("performed_at, workout_sets(reps, weight_kg)")
      .eq("user_id", userId)
      .order("performed_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("longest_streak")
      .eq("id", userId)
      .single(),
  ]);

  const weeklyLogs = weeklyRes.data ?? [];
  const monthlyLogs = monthlyRes.data ?? [];
  const allLogs = allLogsRes.data ?? [];

  const weeklyWorkouts = weeklyLogs.length;
  const monthlyWorkouts = monthlyLogs.length;
  const longestStreak = profileRes.data?.longest_streak ?? 0;

  // Total volume
  const totalVolume = allLogs.reduce((total, log) => {
    const logVolume = (log.workout_sets ?? []).reduce(
      (sum: number, s: { reps: number; weight_kg: number }) =>
        sum + s.reps * Number(s.weight_kg),
      0
    );
    return total + logVolume;
  }, 0);

  return (
    <StatsCards
      weeklyWorkouts={weeklyWorkouts}
      monthlyWorkouts={monthlyWorkouts}
      longestStreak={longestStreak}
      totalVolume={Math.round(totalVolume)}
    />
  );
}
