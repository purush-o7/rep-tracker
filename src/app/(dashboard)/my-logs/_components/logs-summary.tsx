import { startOfWeek, startOfMonth } from "date-fns";
import { CalendarDays, Dumbbell, Flame, TrendingUp, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

interface LogsSummaryProps {
  userId: string;
}

const dayKey = (iso: string) => iso.slice(0, 10);

export async function LogsSummary({ userId }: LogsSummaryProps) {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const [allRes, weekRes, profileRes] = await Promise.all([
    // lightweight: one row per log, for distinct-day + PR counts
    supabase
      .from("workout_logs")
      .select("performed_at, is_pr")
      .eq("user_id", userId),
    // this week's sets for volume
    supabase
      .from("workout_logs")
      .select("performed_at, workout_sets(reps, weight_kg)")
      .eq("user_id", userId)
      .gte("performed_at", weekStart.toISOString()),
    supabase
      .from("profiles")
      .select("current_streak")
      .eq("id", userId)
      .single(),
  ]);

  const allLogs = allRes.data ?? [];
  const weekLogs = weekRes.data ?? [];

  const totalDays = new Set(allLogs.map((l) => dayKey(l.performed_at))).size;
  const weekDays = new Set(
    allLogs
      .filter((l) => new Date(l.performed_at) >= weekStart)
      .map((l) => dayKey(l.performed_at))
  ).size;
  const monthDays = new Set(
    allLogs
      .filter((l) => new Date(l.performed_at) >= monthStart)
      .map((l) => dayKey(l.performed_at))
  ).size;
  const prsThisMonth = allLogs.filter(
    (l) => l.is_pr && new Date(l.performed_at) >= monthStart
  ).length;
  const weekVolume = weekLogs.reduce(
    (sum, l) =>
      sum +
      l.workout_sets.reduce(
        (s, set) => s + (set.reps ?? 0) * Number(set.weight_kg),
        0
      ),
    0
  );
  const streak = profileRes.data?.current_streak ?? 0;

  const stats = [
    { label: "This week", value: `${weekDays}`, sub: "days", icon: CalendarDays },
    { label: "This month", value: `${monthDays}`, sub: "days", icon: Dumbbell },
    { label: "Streak", value: `${streak}`, sub: "days", icon: Flame, accent: "text-orange-500" },
    {
      label: "Week volume",
      value:
        weekVolume >= 1000
          ? `${(weekVolume / 1000).toFixed(1)}t`
          : `${weekVolume}`,
      sub: "kg",
      icon: TrendingUp,
    },
    { label: "PRs", value: `${prsThisMonth}`, sub: "this mo.", icon: Trophy, accent: "text-amber-500" },
    { label: "Total", value: `${totalDays}`, sub: "sessions", icon: CalendarDays },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-2.5 sm:p-3">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Icon className={`h-3 w-3 ${s.accent ?? ""}`} />
              <span className="truncate">{s.label}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold leading-none">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.sub}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function LogsSummarySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="h-[58px] animate-pulse p-2.5 sm:p-3" />
      ))}
    </div>
  );
}
