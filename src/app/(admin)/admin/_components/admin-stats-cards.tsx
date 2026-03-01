import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { AdminStatsDisplay } from "./admin-stats-display";

export async function AdminStatsCards() {
  const supabase = await createClient();
  const sevenDaysAgo = subDays(new Date(), 7);

  const [usersRes, workoutsRes, logsRes, activeRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("workouts").select("id", { count: "exact", head: true }),
    supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("workout_logs")
      .select("user_id")
      .gte("performed_at", sevenDaysAgo.toISOString()),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const totalWorkouts = workoutsRes.count ?? 0;
  const totalLogs = logsRes.count ?? 0;
  const activeUsers = new Set(
    (activeRes.data ?? []).map((l) => l.user_id)
  ).size;

  return (
    <AdminStatsDisplay
      totalUsers={totalUsers}
      totalWorkouts={totalWorkouts}
      totalLogs={totalLogs}
      activeUsers={activeUsers}
    />
  );
}
