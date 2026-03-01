"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSetInput } from "@/lib/validators/workout-log";

export async function addWorkoutToPlan(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  // Get next sort_order
  const { data: existing } = await supabase
    .from("daily_plan_items")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("plan_date", today)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data: item, error } = await supabase
    .from("daily_plan_items")
    .upsert(
      {
        user_id: user.id,
        workout_id: workoutId,
        plan_date: today,
        sort_order: nextOrder,
      },
      { onConflict: "user_id,workout_id,plan_date", ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error && error.code !== "PGRST116") return { error: error.message };

  revalidatePath("/today");
  return { data: item };
}

export async function addRoutineToPlan(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch routine items
  const { data: groupItems, error: fetchError } = await supabase
    .from("workout_group_items")
    .select("workout_id, sort_order")
    .eq("group_id", groupId)
    .order("sort_order");

  if (fetchError) return { error: fetchError.message };
  if (!groupItems || groupItems.length === 0) return { error: "Routine has no workouts" };

  const today = new Date().toISOString().split("T")[0];

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("daily_plan_items")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("plan_date", today)
    .order("sort_order", { ascending: false })
    .limit(1);

  const baseOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const itemsToInsert = groupItems.map((gi, i) => ({
    user_id: user.id,
    workout_id: gi.workout_id,
    plan_date: today,
    sort_order: baseOrder + i,
    source_group_id: groupId,
  }));

  const { error } = await supabase
    .from("daily_plan_items")
    .upsert(itemsToInsert, {
      onConflict: "user_id,workout_id,plan_date",
      ignoreDuplicates: true,
    });

  if (error) return { error: error.message };

  revalidatePath("/today");
  return { data: true };
}

export async function reorderPlanItems(orderedIds: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("daily_plan_items")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/today");
  return { data: true };
}

export async function removeFromPlan(planItemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("daily_plan_items")
    .delete()
    .eq("id", planItemId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/today");
  return { data: true };
}

export async function logWorkoutFromPlan(data: {
  plan_item_id: string;
  workout_id: string;
  sets: WorkoutSetInput[];
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify plan item ownership
  const { data: planItem } = await supabase
    .from("daily_plan_items")
    .select("id")
    .eq("id", data.plan_item_id)
    .eq("user_id", user.id)
    .single();

  if (!planItem) return { error: "Plan item not found" };

  // Insert workout log
  const { data: log, error: logError } = await supabase
    .from("workout_logs")
    .insert({
      user_id: user.id,
      workout_id: data.workout_id,
      notes: data.notes || null,
      performed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (logError) return { error: logError.message };

  // Insert sets
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

  // Mark plan item as completed
  const { error: updateError } = await supabase
    .from("daily_plan_items")
    .update({
      is_completed: true,
      workout_log_id: log.id,
    })
    .eq("id", data.plan_item_id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/today");
  revalidatePath("/my-logs");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { data: log };
}
