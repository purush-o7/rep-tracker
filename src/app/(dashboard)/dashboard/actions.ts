"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logBodyWeight(weightKg: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };
  if (!weightKg || weightKg <= 0 || weightKg >= 500) {
    return { error: "Enter a valid weight" };
  }

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("body_weight_logs").upsert(
    { user_id: user.id, log_date: today, weight_kg: weightKg },
    { onConflict: "user_id,log_date" }
  );

  if (error) return { error: error.message };

  // Keep the profile's current weight in sync
  await supabase
    .from("profiles")
    .update({ weight_kg: weightKg })
    .eq("id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { data: true };
}
