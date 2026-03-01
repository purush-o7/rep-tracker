import {
  startOfWeek,
  subDays,
  format,
  eachDayOfInterval,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { WeeklyActivityChart } from "./weekly-activity-chart";
import { MonthlyActivityChart } from "./monthly-activity-chart";
import { TopExercisesCard } from "./top-exercises-card";
import { MuscleGroupChart } from "./muscle-group-chart";

interface DashboardChartsProps {
  userId: string;
}

export async function DashboardCharts({ userId }: DashboardChartsProps) {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thirtyDaysAgo = subDays(now, 30);

  const [weeklyRes, allLogsRes, muscleRes] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("performed_at")
      .eq("user_id", userId)
      .gte("performed_at", weekStart.toISOString()),
    supabase
      .from("workout_logs")
      .select("performed_at, workouts(name)")
      .eq("user_id", userId)
      .order("performed_at", { ascending: false }),
    supabase
      .from("muscle_group_activity")
      .select("*")
      .eq("user_id", userId),
  ]);

  const weeklyLogs = weeklyRes.data ?? [];
  const allLogs = allLogsRes.data ?? [];

  // Weekly activity chart data
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyChartData = dayNames.map((day, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const dayStr = format(dayDate, "yyyy-MM-dd");
    const count = weeklyLogs.filter(
      (l) => format(new Date(l.performed_at), "yyyy-MM-dd") === dayStr
    ).length;
    return { day, count };
  });

  // Monthly activity chart data
  const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
  const recentLogs = allLogs.filter(
    (l) => new Date(l.performed_at) >= thirtyDaysAgo
  );
  const monthlyChartData = last30Days.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const count = recentLogs.filter(
      (l) => format(new Date(l.performed_at), "yyyy-MM-dd") === dateStr
    ).length;
    return { date: format(date, "MMM d"), count };
  });

  // Top exercises
  const exerciseCounts: Record<string, number> = {};
  allLogs.forEach((log) => {
    const name =
      (log.workouts as unknown as { name: string })?.name ?? "Unknown";
    exerciseCounts[name] = (exerciseCounts[name] ?? 0) + 1;
  });
  const topExercises = Object.entries(exerciseCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Muscle group data
  const muscleData = (muscleRes.data ?? []).map(
    (m: { tag_name: string; workout_count: number }) => ({
      muscle: m.tag_name,
      count: m.workout_count,
    })
  );

  return (
    <>
      <div
        className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={{ animationDuration: "500ms", animationDelay: "400ms" }}
      >
        <WeeklyActivityChart data={weeklyChartData} />
        <MonthlyActivityChart data={monthlyChartData} />
      </div>
      <div
        className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={{ animationDuration: "500ms", animationDelay: "600ms" }}
      >
        <TopExercisesCard data={topExercises} />
        <MuscleGroupChart data={muscleData} />
      </div>
    </>
  );
}
