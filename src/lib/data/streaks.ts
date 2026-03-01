import type { SupabaseClient } from "@supabase/supabase-js";

export async function recalculateStreak(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string
) {
  const { data: logs } = await supabase
    .from("workout_logs")
    .select("performed_at")
    .eq("user_id", userId)
    .order("performed_at", { ascending: false });

  if (!logs || logs.length === 0) {
    await supabase
      .from("profiles")
      .update({ current_streak: 0, longest_streak: 0, last_workout_date: null })
      .eq("id", userId);
    return;
  }

  // Get unique dates as YYYY-MM-DD strings, sorted descending
  const uniqueDays = [
    ...new Set(logs.map((l) => l.performed_at.slice(0, 10))),
  ].sort().reverse();

  const lastWorkoutDate = uniqueDays[0];

  // Current streak: count consecutive days from today/yesterday
  const today = new Date();
  const todayStr = toDateStr(today);
  const yesterdayStr = toDateStr(new Date(today.getTime() - 86400000));

  let currentStreak = 0;
  if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const diff = daysDiff(uniqueDays[i - 1], uniqueDays[i]);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all unique days (ascending) for longest consecutive run
  const ascending = [...uniqueDays].reverse();
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < ascending.length; i++) {
    const diff = daysDiff(ascending[i], ascending[i - 1]);
    if (diff === 1) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  await supabase
    .from("profiles")
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_workout_date: lastWorkoutDate,
    })
    .eq("id", userId);
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysDiff(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}
