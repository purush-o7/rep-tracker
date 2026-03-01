import type { SupabaseClient } from "@supabase/supabase-js";

export async function getStreakLeaderboards(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
) {
  const [currentRes, longestRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, handle, avatar_url, current_streak")
      .eq("is_public", true)
      .gt("current_streak", 0)
      .order("current_streak", { ascending: false })
      .limit(10),
    supabase
      .from("profiles")
      .select("full_name, handle, avatar_url, longest_streak")
      .eq("is_public", true)
      .gt("longest_streak", 0)
      .order("longest_streak", { ascending: false })
      .limit(10),
  ]);

  return {
    currentStreaks: currentRes.data ?? [],
    longestStreaks: longestRes.data ?? [],
  };
}
