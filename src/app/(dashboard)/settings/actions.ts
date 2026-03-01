"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(data: {
  full_name: string;
  age?: number | null;
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  handle?: string | null;
  is_public?: boolean;
  partner_can_view_logs?: boolean;
  partner_can_edit_logs?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505" && error.message.includes("handle")) {
      return { error: "This handle is already taken" };
    }
    if (error.code === "23514" && error.message.includes("handle_format")) {
      return { error: "Handle must be 3-30 lowercase letters, numbers, dots, or underscores" };
    }
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { data: true };
}

export async function checkHandleAvailability(handle: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .neq("id", user.id)
    .maybeSingle();

  return { available: !existing };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/settings");
  return { data: publicUrl };
}
