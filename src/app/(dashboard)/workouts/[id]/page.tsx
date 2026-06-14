import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { WorkoutDetail } from "./_components/workout-detail";
import { WorkoutProgress } from "./_components/workout-progress";
import type { ProgressionPoint, WorkoutStats } from "./_components/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("name")
    .eq("id", id)
    .single();

  return { title: `${data?.name ?? "Workout"} - GymTracker` };
}

const epley1RM = (weight: number, reps: number) =>
  reps > 0 ? Math.round(weight * (1 + reps / 30)) : 0;

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("*, workout_tags(*, tags(*)), workout_images(*)")
    .eq("id", id)
    .single();

  if (!workout) notFound();

  const user = await getAuthUser(supabase);

  let points: ProgressionPoint[] = [];
  let stats: WorkoutStats | null = null;

  if (user) {
    const { data: logs } = await supabase
      .from("workout_logs")
      .select(
        "performed_at, is_pr, workout_sets(reps, weight_kg, duration_seconds, distance_m)"
      )
      .eq("user_id", user.id)
      .eq("workout_id", id)
      .order("performed_at", { ascending: true });

    if (logs && logs.length > 0) {
      points = logs.map((log) => {
        const sets = log.workout_sets;
        const weights = sets
          .map((s) => Number(s.weight_kg))
          .filter((w) => w > 0);
        const maxWeight = weights.length ? Math.max(...weights) : 0;
        const topReps =
          sets
            .filter((s) => Number(s.weight_kg) === maxWeight && (s.reps ?? 0) > 0)
            .map((s) => s.reps ?? 0)
            .sort((a, b) => b - a)[0] ?? 0;
        const volume = sets.reduce(
          (sum, s) => sum + (s.reps ?? 0) * Number(s.weight_kg),
          0
        );
        const est1RM = Math.max(
          0,
          ...sets.map((s) => epley1RM(Number(s.weight_kg), s.reps ?? 0))
        );
        const maxDuration = Math.max(
          0,
          ...sets.map((s) => s.duration_seconds ?? 0)
        );
        const totalDistance = sets.reduce(
          (sum, s) => sum + (s.distance_m ?? 0),
          0
        );
        return {
          date: format(new Date(log.performed_at), "MMM d"),
          isoDate: log.performed_at,
          setCount: sets.length,
          maxWeight,
          topReps,
          volume,
          est1RM,
          maxDuration,
          totalDistance,
          isPr: log.is_pr,
        };
      });

      stats = {
        totalSessions: points.length,
        firstDate: points[0].isoDate,
        lastDate: points[points.length - 1].isoDate,
        prCount: points.filter((p) => p.isPr).length,
        bestWeight: Math.max(...points.map((p) => p.maxWeight)),
        bestWeightReps:
          points.find(
            (p) => p.maxWeight === Math.max(...points.map((x) => x.maxWeight))
          )?.topReps ?? 0,
        best1RM: Math.max(...points.map((p) => p.est1RM)),
        bestVolume: Math.max(...points.map((p) => p.volume)),
        bestDuration: Math.max(...points.map((p) => p.maxDuration)),
        bestDistance: Math.max(...points.map((p) => p.totalDistance)),
      };
    }
  }

  return (
    <div className="space-y-8">
      <WorkoutDetail workout={workout} stats={stats} />
      <WorkoutProgress
        logType={workout.log_type}
        points={points}
        stats={stats}
      />
    </div>
  );
}
