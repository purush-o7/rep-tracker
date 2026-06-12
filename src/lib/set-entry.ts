import type { LogType } from "@/lib/types";
import type { WorkoutSetInput } from "@/lib/validators/workout-log";

/** Client-side state for one set row, covering all log types */
export interface SetEntry {
  reps: number;
  weight_kg: number;
  duration_seconds: number;
  distance_m: number;
}

export function emptySet(): SetEntry {
  return { reps: 0, weight_kg: 0, duration_seconds: 0, distance_m: 0 };
}

export function isValidSet(entry: SetEntry, logType: LogType): boolean {
  if (logType === "duration") return entry.duration_seconds > 0;
  if (logType === "distance") return entry.distance_m > 0;
  return entry.reps > 0;
}

export function toSetInputs(
  entries: SetEntry[],
  logType: LogType
): WorkoutSetInput[] {
  return entries
    .filter((e) => isValidSet(e, logType))
    .map((e, i) => ({
      set_number: i + 1,
      reps: logType === "weight_reps" ? e.reps : null,
      weight_kg: logType === "weight_reps" ? e.weight_kg : 0,
      duration_seconds: logType === "duration" ? e.duration_seconds : null,
      distance_m: logType === "distance" ? e.distance_m : null,
    }));
}

export function fromLoggedSet(set: {
  reps: number | null;
  weight_kg: number;
  duration_seconds: number | null;
  distance_m: number | null;
}): SetEntry {
  return {
    reps: set.reps ?? 0,
    weight_kg: Number(set.weight_kg) || 0,
    duration_seconds: set.duration_seconds ?? 0,
    distance_m: set.distance_m ?? 0,
  };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters} m`;
}

/** Human summary of a logged set, regardless of type */
export function formatLoggedSet(set: {
  reps: number | null;
  weight_kg: number;
  duration_seconds: number | null;
  distance_m: number | null;
}): string {
  if (set.duration_seconds) return formatDuration(set.duration_seconds);
  if (set.distance_m) return formatDistance(set.distance_m);
  return `${set.reps ?? 0} × ${Number(set.weight_kg)} kg`;
}
