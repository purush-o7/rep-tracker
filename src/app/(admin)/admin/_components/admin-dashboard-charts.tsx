import { subDays, format, eachDayOfInterval } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { AdminSignupsChart } from "./admin-signups-chart";
import { AdminActivityChart } from "./admin-activity-chart";
import { AdminPopularWorkoutsChart } from "./admin-popular-workouts-chart";
import { AdminTagDistributionChart } from "./admin-tag-distribution-chart";

export async function AdminDashboardCharts() {
  const supabase = await createClient();
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const fourteenDaysAgo = subDays(now, 14);

  const [signupsRes, logsRes, popularRes, tagRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at"),
    supabase
      .from("workout_logs")
      .select("performed_at")
      .gte("performed_at", fourteenDaysAgo.toISOString())
      .order("performed_at"),
    supabase
      .from("workout_logs")
      .select("workout_id, workouts(name)")
      .order("performed_at", { ascending: false }),
    supabase.from("workout_tags").select("tag_id, tags(name)"),
  ]);

  // Signups last 30 days
  const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
  const signups = signupsRes.data ?? [];
  const signupsData = last30Days.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const count = signups.filter(
      (s) => format(new Date(s.created_at), "yyyy-MM-dd") === dateStr
    ).length;
    return { date: format(date, "MMM d"), count };
  });

  // Daily logs last 14 days
  const last14Days = eachDayOfInterval({ start: fourteenDaysAgo, end: now });
  const logs = logsRes.data ?? [];
  const activityData = last14Days.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const count = logs.filter(
      (l) => format(new Date(l.performed_at), "yyyy-MM-dd") === dateStr
    ).length;
    return { date: format(date, "MMM d"), count };
  });

  // Popular workouts
  const workoutCounts: Record<string, number> = {};
  (popularRes.data ?? []).forEach((log) => {
    const name =
      (log.workouts as unknown as { name: string })?.name ?? "Unknown";
    workoutCounts[name] = (workoutCounts[name] ?? 0) + 1;
  });
  const popularWorkouts = Object.entries(workoutCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Tag distribution
  const tagCounts: Record<string, number> = {};
  (tagRes.data ?? []).forEach((wt) => {
    const name = (wt.tags as unknown as { name: string })?.name ?? "Unknown";
    tagCounts[name] = (tagCounts[name] ?? 0) + 1;
  });
  const tagDistribution = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <div
        className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={{ animationDuration: "500ms", animationDelay: "400ms" }}
      >
        <AdminSignupsChart data={signupsData} />
        <AdminActivityChart data={activityData} />
      </div>
      <div
        className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={{ animationDuration: "500ms", animationDelay: "600ms" }}
      >
        <AdminPopularWorkoutsChart data={popularWorkouts} />
        <AdminTagDistributionChart data={tagDistribution} />
      </div>
    </>
  );
}
