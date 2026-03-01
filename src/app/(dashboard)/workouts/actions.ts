"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSetInput } from "@/lib/validators/workout-log";

export async function logWorkout(data: {
  workout_id: string;
  notes?: string;
  performed_at?: string;
  sets: WorkoutSetInput[];
  for_user_id?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  let targetUserId = user.id;

  // Partner logging: verify partnership and enforce today-only
  if (data.for_user_id && data.for_user_id !== user.id) {
    const { data: partnership } = await supabase
      .from("workout_partners")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${data.for_user_id}),and(addressee_id.eq.${user.id},requester_id.eq.${data.for_user_id})`
      )
      .single();

    if (!partnership) return { error: "Not a valid partner" };

    // Check partner_can_edit_logs permission
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("partner_can_edit_logs")
      .eq("id", data.for_user_id)
      .single();

    if (!targetProfile?.partner_can_edit_logs) {
      return { error: "This partner does not allow others to add logs for them" };
    }

    // Today-only restriction
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const performedAt = data.performed_at ? new Date(data.performed_at) : now;

    if (performedAt < todayStart || performedAt >= tomorrowStart) {
      return { error: "Partner logs can only be added for today" };
    }

    targetUserId = data.for_user_id;
  }

  const { data: log, error } = await supabase
    .from("workout_logs")
    .insert({
      user_id: targetUserId,
      workout_id: data.workout_id,
      notes: data.notes || null,
      performed_at: data.performed_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const setsToInsert = data.sets.map((set) => ({
    log_id: log.id,
    set_number: set.set_number,
    reps: set.reps,
    weight_kg: set.weight_kg,
  }));

  const { error: setsError } = await supabase
    .from("workout_sets")
    .insert(setsToInsert);

  if (setsError) return { error: setsError.message };

  revalidatePath("/my-logs");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { data: log };
}

export async function deleteLog(logId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", logId);

  if (error) return { error: error.message };

  revalidatePath("/my-logs");
  revalidatePath("/dashboard");
  return { data: true };
}
