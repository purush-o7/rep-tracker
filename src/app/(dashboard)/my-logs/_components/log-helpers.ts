import { formatLoggedSet, formatDuration, formatDistance } from "@/lib/set-entry";
import type { LogType, WorkoutLogWithDetails } from "@/lib/types";

/** workout_tags isn't on the base Workout type — read it loosely off the row */
export function logTags(log: WorkoutLogWithDetails): string[] {
  const tags = (log.workouts as { workout_tags?: { tags: { name: string } | null }[] })
    .workout_tags;
  return (tags ?? [])
    .map((t) => t.tags?.name)
    .filter((n): n is string => !!n);
}

export function logSetType(log: WorkoutLogWithDetails): LogType {
  return log.workouts.log_type ?? "weight_reps";
}

const epley = (w: number, r: number) => (r > 0 ? Math.round(w * (1 + r / 30)) : 0);

export interface LogSummary {
  setCount: number;
  /** kg moved — only meaningful for weight_reps */
  volume: number;
  /** short headline metric for the row, e.g. "60 kg × 5", "1m 30s", "5 km" */
  metric: string;
  /** estimated 1-rep max (weight_reps only) */
  est1RM: number;
}

export function summarizeLog(log: WorkoutLogWithDetails): LogSummary {
  const sets = log.workout_sets;
  const type = logSetType(log);

  if (type === "duration") {
    const best = Math.max(0, ...sets.map((s) => s.duration_seconds ?? 0));
    return {
      setCount: sets.length,
      volume: 0,
      metric: best ? formatDuration(best) : "—",
      est1RM: 0,
    };
  }
  if (type === "distance") {
    const total = sets.reduce((s, x) => s + (x.distance_m ?? 0), 0);
    return {
      setCount: sets.length,
      volume: 0,
      metric: total ? formatDistance(total) : "—",
      est1RM: 0,
    };
  }

  const weights = sets.map((s) => Number(s.weight_kg)).filter((w) => w > 0);
  const topWeight = weights.length ? Math.max(...weights) : 0;
  const topReps =
    sets
      .filter((s) => Number(s.weight_kg) === topWeight && (s.reps ?? 0) > 0)
      .map((s) => s.reps ?? 0)
      .sort((a, b) => b - a)[0] ?? 0;
  const volume = sets.reduce(
    (s, x) => s + (x.reps ?? 0) * Number(x.weight_kg),
    0
  );
  const est1RM = Math.max(0, ...sets.map((s) => epley(Number(s.weight_kg), s.reps ?? 0)));

  // Fall back to first logged set summary when there's no weighted top set
  const metric = topWeight
    ? `${topWeight} kg${topReps ? ` × ${topReps}` : ""}`
    : sets[0]
      ? formatLoggedSet(sets[0])
      : "—";

  return { setCount: sets.length, volume, metric, est1RM };
}

export { formatDuration, formatDistance };
