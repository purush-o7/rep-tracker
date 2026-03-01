"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchAllLogsForExport(filters?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  let query = supabase
    .from("workout_logs")
    .select("performed_at, notes, workouts(name), workout_sets(set_number, reps, weight_kg)")
    .eq("user_id", user.id)
    .order("performed_at", { ascending: false });

  if (filters?.dateFrom) {
    query = query.gte("performed_at", `${filters.dateFrom}T00:00:00`);
  }
  if (filters?.dateTo) {
    query = query.lte("performed_at", `${filters.dateTo}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) return { error: error.message };

  return { data };
}
