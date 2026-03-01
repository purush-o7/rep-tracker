import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { WorkoutDetail } from "./_components/workout-detail";
import { WorkoutProgressCharts } from "./_components/workout-progress-charts";

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

  // Fetch user's logs for this workout (for progress charts)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let weightData: { date: string; maxWeight: number }[] = [];
  let volumeData: { date: string; volume: number }[] = [];

  if (user) {
    const { data: logs } = await supabase
      .from("workout_logs")
      .select("performed_at, workout_sets(weight_kg, reps)")
      .eq("user_id", user.id)
      .eq("workout_id", id)
      .order("performed_at", { ascending: true });

    if (logs && logs.length > 0) {
      weightData = logs.map((log) => ({
        date: format(new Date(log.performed_at), "MMM d"),
        maxWeight: Math.max(...log.workout_sets.map((s) => Number(s.weight_kg)), 0),
      }));
      volumeData = logs.map((log) => ({
        date: format(new Date(log.performed_at), "MMM d"),
        volume: log.workout_sets.reduce(
          (sum, s) => sum + s.reps * Number(s.weight_kg),
          0
        ),
      }));
    }
  }

  return (
    <div className="space-y-8">
      <WorkoutDetail workout={workout} />
      <WorkoutProgressCharts
        exerciseName={workout.name}
        weightData={weightData}
        volumeData={volumeData}
      />
    </div>
  );
}
