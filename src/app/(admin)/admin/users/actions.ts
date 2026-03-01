"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function toggleUserRole(
  userId: string,
  newRole: "user" | "super_admin"
) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.error) return { error: auth.error };

  // Prevent self-demotion
  if (auth.user!.id === userId && newRole === "user") {
    return { error: "You cannot remove your own admin role" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { data: true };
}
