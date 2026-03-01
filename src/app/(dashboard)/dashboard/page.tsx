import type { Metadata } from "next";
import {
  startOfWeek,
  startOfMonth,
  subDays,
  format,
  eachDayOfInterval,
  differenceInCalendarDays,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "./_components/stats-cards";
import { WeeklyActivityChart } from "./_components/weekly-activity-chart";
import { MonthlyActivityChart } from "./_components/monthly-activity-chart";
import { TopExercisesCard } from "./_components/top-exercises-card";
import { MuscleGroupChart } from "./_components/muscle-group-chart";
import { PartnerSwitcher } from "../_components/partner-switcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - GymTracker",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ partner?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user!.id;
  let viewingUserId = currentUserId;
  let partnerName: string | null = null;

  // Fetch accepted partners for the switcher
  const { data: partnerRows } = await supabase
    .from("workout_partners")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(
      `requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`
    );

  const partnerIds = (partnerRows ?? []).map((p) =>
    p.requester_id === currentUserId ? p.addressee_id : p.requester_id
  );

  let partners: { id: string; full_name: string | null; partner_can_view_logs: boolean }[] = [];
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, partner_can_view_logs")
      .in("id", partnerIds);
    partners = profiles ?? [];
  }

  // If viewing a partner, verify the partnership
  let partnerViewRestricted = false;
  if (params.partner && partnerIds.includes(params.partner)) {
    viewingUserId = params.partner;
    const partnerProfile = partners.find((p) => p.id === params.partner);
    partnerName = partnerProfile?.full_name ?? "Partner";
    if (partnerProfile && !partnerProfile.partner_can_view_logs) {
      partnerViewRestricted = true;
    }
  }

  if (partnerViewRestricted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {partners.length > 0 && (
            <PartnerSwitcher
              partners={partners}
              activePartnerId={params.partner}
            />
          )}
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>{partnerName}</strong> has restricted access to their workout data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const userId = viewingUserId;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = subDays(now, 30);

  // Fetch all data in parallel
  const [weeklyRes, monthlyRes, allLogsRes, muscleRes] = await Promise.all([
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
      .select("performed_at, workouts(name), workout_sets(reps, weight_kg)")
      .eq("user_id", userId)
      .order("performed_at", { ascending: false }),
    supabase
      .from("muscle_group_activity")
      .select("*")
      .eq("user_id", userId),
  ]);

  const weeklyLogs = weeklyRes.data ?? [];
  const monthlyLogs = monthlyRes.data ?? [];
  const allLogs = allLogsRes.data ?? [];

  // Stats
  const weeklyWorkouts = weeklyLogs.length;
  const monthlyWorkouts = monthlyLogs.length;

  // Calculate streak
  let currentStreak = 0;
  if (allLogs.length > 0) {
    const uniqueDays = [
      ...new Set(
        allLogs.map((l) => format(new Date(l.performed_at), "yyyy-MM-dd"))
      ),
    ].sort().reverse();

    const today = format(now, "yyyy-MM-dd");
    const yesterday = format(subDays(now, 1), "yyyy-MM-dd");

    if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const diff = differenceInCalendarDays(
          new Date(uniqueDays[i - 1]),
          new Date(uniqueDays[i])
        );
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Total volume
  const totalVolume = allLogs.reduce((total, log) => {
    const logVolume = (log.workout_sets ?? []).reduce(
      (sum: number, s: { reps: number; weight_kg: number }) =>
        sum + s.reps * Number(s.weight_kg),
      0
    );
    return total + logVolume;
  }, 0);

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
    const name = (log.workouts as unknown as { name: string })?.name ?? "Unknown";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {partners.length > 0 && (
          <PartnerSwitcher
            partners={partners}
            activePartnerId={params.partner}
          />
        )}
      </div>
      {partnerName && (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Viewing <strong>{partnerName}</strong>&apos;s dashboard
          </AlertDescription>
        </Alert>
      )}
      <StatsCards
        weeklyWorkouts={weeklyWorkouts}
        monthlyWorkouts={monthlyWorkouts}
        currentStreak={currentStreak}
        totalVolume={Math.round(totalVolume)}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <WeeklyActivityChart data={weeklyChartData} />
        <MonthlyActivityChart data={monthlyChartData} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TopExercisesCard data={topExercises} />
        <MuscleGroupChart data={muscleData} />
      </div>
    </div>
  );
}
