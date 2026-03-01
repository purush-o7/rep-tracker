"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CreateWorkoutGroupInput } from "@/lib/validators/workout-group";

const MAX_ROUTINES = 10;

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
