"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateWorkoutGroupInput } from "@/lib/validators/workout-group";

const MAX_ROUTINES = 10;

/** Toggle whether one of your routines is shared publicly. */
export async function setRoutineVisibility(groupId: string, isPublic: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("workout_groups")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", groupId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/routines");
  revalidatePath(`/routines/${groupId}`);
  return { data: true };
}

/** Copy any routine you can see (public/system/own) into your own routines. */
export async function copyRoutine(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { count } = await supabase
    .from("workout_groups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_ROUTINES) {
    return { error: `You can keep up to ${MAX_ROUTINES} routines` };
  }

  // RLS lets us read it only if it's ours or public
  const { data: source, error: srcError } = await supabase
    .from("workout_groups")
    .select(
      "name, description, workout_group_items(workout_id, sort_order, target_sets, target_reps, target_weight_kg)"
    )
    .eq("id", groupId)
    .single();

  if (srcError || !source) return { error: "Routine not found" };

  const { data: group, error: groupError } = await supabase
    .from("workout_groups")
    .insert({
      user_id: user.id,
      name: source.name.slice(0, 100),
      description: source.description,
      is_public: false,
      source_group_id: groupId,
    })
    .select("id")
    .single();

  if (groupError) return { error: groupError.message };

  const items = source.workout_group_items ?? [];
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("workout_group_items")
      .insert(
        items.map((it) => ({
          group_id: group.id,
          workout_id: it.workout_id,
          sort_order: it.sort_order,
          target_sets: it.target_sets,
          target_reps: it.target_reps,
          target_weight_kg: it.target_weight_kg,
        }))
      );
    if (itemsError) return { error: itemsError.message };
  }

  revalidatePath("/routines");
  return { data: group };
}

export async function createWorkoutGroup(data: CreateWorkoutGroupInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check limit
  const { count } = await supabase
    .from("workout_groups")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_ROUTINES) {
    return { error: `You can create up to ${MAX_ROUTINES} routines` };
  }

  const { data: group, error: groupError } = await supabase
    .from("workout_groups")
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description || null,
    })
    .select()
    .single();

  if (groupError) return { error: groupError.message };

  if (data.items.length > 0) {
    const itemsToInsert = data.items.map((item) => ({
      group_id: group.id,
      workout_id: item.workout_id,
      sort_order: item.sort_order,
      target_sets: item.target_sets ?? null,
      target_reps: item.target_reps ?? null,
      target_weight_kg: item.target_weight_kg ?? null,
    }));

    const { error: itemsError } = await supabase
      .from("workout_group_items")
      .insert(itemsToInsert);

    if (itemsError) return { error: itemsError.message };
  }

  revalidatePath("/routines");
  return { data: group };
}

export async function updateWorkoutGroup(
  groupId: string,
  data: CreateWorkoutGroupInput
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error: updateError } = await supabase
    .from("workout_groups")
    .update({
      name: data.name,
      description: data.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  // Delete old items, re-insert
  await supabase
    .from("workout_group_items")
    .delete()
    .eq("group_id", groupId);

  if (data.items.length > 0) {
    const itemsToInsert = data.items.map((item) => ({
      group_id: groupId,
      workout_id: item.workout_id,
      sort_order: item.sort_order,
      target_sets: item.target_sets ?? null,
      target_reps: item.target_reps ?? null,
      target_weight_kg: item.target_weight_kg ?? null,
    }));

    const { error: itemsError } = await supabase
      .from("workout_group_items")
      .insert(itemsToInsert);

    if (itemsError) return { error: itemsError.message };
  }

  revalidatePath("/routines");
  revalidatePath(`/routines/${groupId}`);
  return { data: true };
}

/**
 * Set which weekdays a routine is scheduled on. Each weekday holds at most one
 * routine (unique per user+day), so selecting a day for this routine overwrites
 * whatever was there; deselecting removes only this routine's days.
 */
export async function setRoutineScheduleDays(groupId: string, days: number[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const validDays = [...new Set(days)].filter((d) => d >= 0 && d <= 6);

  // Remove this routine from any day no longer selected
  let removeQuery = supabase
    .from("weekly_schedule")
    .delete()
    .eq("user_id", user.id)
    .eq("group_id", groupId);
  if (validDays.length > 0) {
    removeQuery = removeQuery.not("day_of_week", "in", `(${validDays.join(",")})`);
  }
  const { error: delError } = await removeQuery;
  if (delError) return { error: delError.message };

  // Assign this routine to each selected day (overwriting other routines there)
  if (validDays.length > 0) {
    const { error: upError } = await supabase.from("weekly_schedule").upsert(
      validDays.map((d) => ({
        user_id: user.id,
        day_of_week: d,
        group_id: groupId,
      })),
      { onConflict: "user_id,day_of_week" }
    );
    if (upError) return { error: upError.message };
  }

  revalidatePath("/routines");
  revalidatePath(`/routines/${groupId}`);
  revalidatePath("/today");
  return { data: true };
}

export async function deleteWorkoutGroup(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("workout_groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/routines");
  return { data: true };
}
