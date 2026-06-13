"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WorkoutSetInput } from "@/lib/validators/workout-log";
import { checkAndFlagPr } from "@/lib/data/pr";

/**
 * Resolve who a plan write targets. For yourself, write through the normal
 * RLS-bound client. For an accepted partner who allows editing, verify the
 * relationship then write through the admin client (RLS on daily_plan_items
 * only permits owners to insert/delete).
 */
async function resolvePlanTarget(
  supabase: SupabaseClient,
  userId: string,
  forUserId: string | undefined
): Promise<{ error: string } | { targetUserId: string; writer: SupabaseClient }> {
  if (!forUserId || forUserId === userId) {
    return { targetUserId: userId, writer: supabase };
  }

  const { data: partnership } = await supabase
    .from("workout_partners")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${forUserId}),and(addressee_id.eq.${userId},requester_id.eq.${forUserId})`
    )
    .maybeSingle();

  if (!partnership) return { error: "Not a valid partner" };

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("partner_can_edit_logs")
    .eq("id", forUserId)
    .single();

  if (!targetProfile?.partner_can_edit_logs) {
    return { error: "This partner does not allow others to edit their plan" };
  }

  return { targetUserId: forUserId, writer: createAdminClient() };
}

export async function addWorkoutToPlan(workoutId: string, forUserId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const target = await resolvePlanTarget(supabase, user.id, forUserId);
  if ("error" in target) return target;
  const { targetUserId, writer } = target;

  const today = new Date().toISOString().split("T")[0];

  // Get next sort_order
  const { data: existing } = await writer
    .from("daily_plan_items")
    .select("sort_order")
    .eq("user_id", targetUserId)
    .eq("plan_date", today)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data: item, error } = await writer
    .from("daily_plan_items")
    .upsert(
      {
        user_id: targetUserId,
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

export async function addRoutineToPlan(groupId: string, forUserId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const target = await resolvePlanTarget(supabase, user.id, forUserId);
  if ("error" in target) return target;
  const { targetUserId, writer } = target;

  // Fetch routine items (RLS only returns items for routines the user owns)
  const { data: groupItems, error: fetchError } = await supabase
    .from("workout_group_items")
    .select("workout_id, sort_order")
    .eq("group_id", groupId)
    .order("sort_order");

  if (fetchError) return { error: fetchError.message };
  if (!groupItems || groupItems.length === 0) return { error: "Routine has no workouts" };

  const today = new Date().toISOString().split("T")[0];

  // Get current max sort_order
  const { data: existing } = await writer
    .from("daily_plan_items")
    .select("sort_order")
    .eq("user_id", targetUserId)
    .eq("plan_date", today)
    .order("sort_order", { ascending: false })
    .limit(1);

  const baseOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const itemsToInsert = groupItems.map((gi, i) => ({
    user_id: targetUserId,
    workout_id: gi.workout_id,
    plan_date: today,
    sort_order: baseOrder + i,
    source_group_id: groupId,
  }));

  const { error } = await writer
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

export async function removeFromPlan(planItemId: string, forUserId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const target = await resolvePlanTarget(supabase, user.id, forUserId);
  if ("error" in target) return target;
  const { targetUserId, writer } = target;

  const { error } = await writer
    .from("daily_plan_items")
    .delete()
    .eq("id", planItemId)
    .eq("user_id", targetUserId);

  if (error) return { error: error.message };

  revalidatePath("/today");
  return { data: true };
}

export async function logWorkoutFromPlan(data: {
  plan_item_id: string;
  workout_id: string;
  sets: WorkoutSetInput[];
  notes?: string;
  for_user_id?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const targetUserId = data.for_user_id ?? user.id;

  // Logging for a partner: verify accepted partnership + edit permission
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
      return { error: "This partner does not allow others to log for them" };
    }
  }

  // Verify the plan item belongs to the target user
  const { data: planItem } = await supabase
    .from("daily_plan_items")
    .select("id")
    .eq("id", data.plan_item_id)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!planItem) return { error: "Plan item not found" };

  // Insert workout log
  const { data: log, error: logError } = await supabase
    .from("workout_logs")
    .insert({
      user_id: targetUserId,
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
    reps: set.reps ?? null,
    weight_kg: set.weight_kg ?? 0,
    duration_seconds: set.duration_seconds ?? null,
    distance_m: set.distance_m ?? null,
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

  const pr = await checkAndFlagPr(
    supabase,
    targetUserId,
    data.workout_id,
    log.id,
    data.sets
  );

  revalidatePath("/today");
  revalidatePath("/my-logs");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { data: log, pr };
}
