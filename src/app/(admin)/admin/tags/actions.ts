"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { tagSchema } from "@/lib/validators/tag";

export async function createTag(formData: { name: string }) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const parsed = tagSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { data, error } = await supabase
    .from("tags")
    .insert({ name: parsed.data.name })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/tags");
  revalidatePath("/admin/workouts");
  return { data };
}

export async function updateTag(id: string, formData: { name: string }) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const parsed = tagSchema.safeParse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase
    .from("tags")
    .update({ name: parsed.data.name })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/tags");
  revalidatePath("/admin/workouts");
  return { data: true };
}

export async function deleteTag(id: string) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  // Check if tag is in use
  const { count } = await supabase
    .from("workout_tags")
    .select("*", { count: "exact", head: true })
    .eq("tag_id", id);

  if (count && count > 0) {
    return { error: `Tag is used by ${count} workout${count !== 1 ? "s" : ""}. Remove it from all workouts before deleting.` };
  }

  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/tags");
  revalidatePath("/admin/workouts");
  return { data: true };
}
