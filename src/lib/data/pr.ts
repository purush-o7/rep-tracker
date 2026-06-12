import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutSetInput } from "@/lib/validators/workout-log";

export interface PrResult {
  type: "weight" | "reps";
  value: number;
  previous: number;
}

/**
 * Compares a freshly inserted log against the user's history for that exercise.
 * A PR is a heavier top set, or more reps at the same top weight.
 * Flags the log (is_pr) and returns the PR details, or null.
 * Only applies to weight/reps sets — duration & distance sets are skipped.
 */
export async function checkAndFlagPr(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  workoutId: string,
  logId: string,
  sets: WorkoutSetInput[]
): Promise<PrResult | null> {
  const repSets = sets.filter((s) => (s.reps ?? 0) > 0 && s.weight_kg > 0);
  if (repSets.length === 0) return null;

  const newTopWeight = Math.max(...repSets.map((s) => s.weight_kg));
  const newTopReps = Math.max(
    ...repSets.filter((s) => s.weight_kg === newTopWeight).map((s) => s.reps ?? 0)
  );

  // Previous sets for this exercise (excluding the log just created)
  const { data: prev } = await supabase
    .from("workout_sets")
    .select("reps, weight_kg, workout_logs!inner(user_id, workout_id)")
    .eq("workout_logs.user_id", userId)
    .eq("workout_logs.workout_id", workoutId)
    .neq("log_id", logId)
    .gt("weight_kg", 0)
    .order("weight_kg", { ascending: false })
    .limit(50);

  const prevSets = (prev ?? []).filter((s) => (s.reps ?? 0) > 0);
  if (prevSets.length === 0) return null; // first session is a baseline, not a PR

  const prevTopWeight = Math.max(...prevSets.map((s) => Number(s.weight_kg)));

  let pr: PrResult | null = null;
  if (newTopWeight > prevTopWeight) {
    pr = { type: "weight", value: newTopWeight, previous: prevTopWeight };
  } else if (newTopWeight === prevTopWeight) {
    const prevTopReps = Math.max(
      ...prevSets
        .filter((s) => Number(s.weight_kg) === prevTopWeight)
        .map((s) => s.reps ?? 0)
    );
    if (newTopReps > prevTopReps) {
      pr = { type: "reps", value: newTopReps, previous: prevTopReps };
    }
  }

  if (pr) {
    await supabase.from("workout_logs").update({ is_pr: true }).eq("id", logId);
  }
  return pr;
}
