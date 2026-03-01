"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { workoutSchema } from "@/lib/validators/workout";

export async function createWorkout(formData: {
  name: string;
  description?: string;
  youtube_url?: string;
  tag_ids: string[];
}) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const parsed = workoutSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      youtube_url: parsed.data.youtube_url || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  if (parsed.data.tag_ids.length > 0) {
    const tagInserts = parsed.data.tag_ids.map((tag_id) => ({
      workout_id: workout.id,
      tag_id,
    }));
    await supabase.from("workout_tags").insert(tagInserts);
  }

  revalidatePath("/admin/workouts");
  revalidatePath("/workouts");
  return { data: workout };
}

export async function updateWorkout(
  id: string,
  formData: { name: string; description?: string; youtube_url?: string; tag_ids: string[] }
) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const parsed = workoutSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("workouts")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      youtube_url: parsed.data.youtube_url || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Replace tags
  await supabase.from("workout_tags").delete().eq("workout_id", id);
  if (parsed.data.tag_ids.length > 0) {
    const tagInserts = parsed.data.tag_ids.map((tag_id) => ({
      workout_id: id,
      tag_id,
    }));
    await supabase.from("workout_tags").insert(tagInserts);
  }

  revalidatePath("/admin/workouts");
  revalidatePath("/workouts");
  return { data: true };
}

export async function deleteWorkout(id: string) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/workouts");
  revalidatePath("/workouts");
  return { data: true };
}

export async function uploadWorkoutImage(workoutId: string, formData: FormData) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const file = formData.get("file") as File;

  if (!file) return { error: "No file provided" };

  const fileExt = file.name.split(".").pop();
  const filePath = `${workoutId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("workout-images")
    .upload(filePath, file);

  if (uploadError) return { error: uploadError.message };

  const { data: countData } = await supabase
    .from("workout_images")
    .select("id")
    .eq("workout_id", workoutId);

  await supabase.from("workout_images").insert({
    workout_id: workoutId,
    storage_path: filePath,
    display_order: (countData?.length ?? 0) + 1,
  });

  revalidatePath("/admin/workouts");
  revalidatePath("/workouts");
  return { data: filePath };
}

export async function deleteWorkoutImage(imageId: string, storagePath: string) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  await supabase.storage.from("workout-images").remove([storagePath]);
  await supabase.from("workout_images").delete().eq("id", imageId);

  revalidatePath("/admin/workouts");
  revalidatePath("/workouts");
  return { data: true };
}
