"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSetInput } from "@/lib/validators/workout-log";
import { recalculateStreak } from "@/lib/data/streaks";
import { checkAndFlagPr } from "@/lib/data/pr";

function mapSetForInsert(logId: string) {
  return (set: WorkoutSetInput) => ({
    log_id: logId,
    set_number: set.set_number,
    reps: set.reps ?? null,
    weight_kg: set.weight_kg ?? 0,
    duration_seconds: set.duration_seconds ?? null,
    distance_m: set.distance_m ?? null,
  });
}

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

  const { error: setsError } = await supabase
    .from("workout_sets")
    .insert(data.sets.map(mapSetForInsert(log.id)));

  if (setsError) return { error: setsError.message };

  await recalculateStreak(supabase, targetUserId);

  const pr =
    targetUserId === user.id
      ? await checkAndFlagPr(supabase, user.id, data.workout_id, log.id, data.sets)
      : null;

  revalidatePath("/my-logs");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { data: log, pr };
}

export async function getLastSession(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: log, error } = await supabase
    .from("workout_logs")
    .select("performed_at, workout_sets(set_number, reps, weight_kg, duration_seconds, distance_m)")
    .eq("user_id", user.id)
    .eq("workout_id", workoutId)
    .order("performed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!log || log.workout_sets.length === 0) return { data: null };

  return {
    data: {
      performed_at: log.performed_at,
      sets: [...log.workout_sets].sort((a, b) => a.set_number - b.set_number),
    },
  };
}

export async function updateLog(data: {
  log_id: string;
  notes?: string;
  sets: WorkoutSetInput[];
  for_user_id?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const targetUserId = data.for_user_id ?? user.id;

  // Editing for a partner: verify accepted partnership + edit permission
  if (targetUserId !== user.id) {
    const { data: partnership } = await supabase
      .from("workout_partners")
      .select("id")
      .eq("status", "accepted")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(addressee_id.eq.${user.id},requester_id.eq.${targetUserId})`
      )
      .maybeSingle();

    if (!partnership) return { error: "Not a valid partner" };

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("partner_can_edit_logs")
      .eq("id", targetUserId)
      .single();

    if (!targetProfile?.partner_can_edit_logs) {
      return { error: "This partner does not allow others to edit their logs" };
    }
  }

  // Verify the log belongs to the target user, and capture its workout
  const { data: log } = await supabase
    .from("workout_logs")
    .select("id, workout_id")
    .eq("id", data.log_id)
    .eq("user_id", targetUserId)
    .single();

  if (!log) return { error: "Log not found" };

  // Update notes
  const { error: noteError } = await supabase
    .from("workout_logs")
    .update({ notes: data.notes || null })
    .eq("id", data.log_id);

  if (noteError) return { error: noteError.message };

  // Delete old sets and insert new ones
  const { error: deleteError } = await supabase
    .from("workout_sets")
    .delete()
    .eq("log_id", data.log_id);

  if (deleteError) return { error: deleteError.message };

  const { error: setsError } = await supabase
    .from("workout_sets")
    .insert(data.sets.map(mapSetForInsert(data.log_id)));

  if (setsError) return { error: setsError.message };

  await recalculateStreak(supabase, targetUserId);

  // Re-evaluate PR after the edit
  const pr = await checkAndFlagPr(
    supabase,
    targetUserId,
    log.workout_id,
    data.log_id,
    data.sets
  );

  revalidatePath("/my-logs");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { data: true, pr };
}

export async function getWorkoutPref(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data } = await supabase
    .from("user_workout_prefs")
    .select("equipment_note")
    .eq("user_id", user.id)
    .eq("workout_id", workoutId)
    .maybeSingle();

  return { data: data?.equipment_note ?? null };
}

export async function saveWorkoutPref(workoutId: string, equipmentNote: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const note = equipmentNote.trim().slice(0, 300);

  const { error } = await supabase.from("user_workout_prefs").upsert({
    user_id: user.id,
    workout_id: workoutId,
    equipment_note: note || null,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { data: true };
}

export async function deleteLog(logId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await recalculateStreak(supabase, user.id);

  revalidatePath("/my-logs");
  revalidatePath("/dashboard");
  return { data: true };
}
