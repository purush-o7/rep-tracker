"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sendPartnerInvite(data: { handle: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Use admin client so private profiles can also be found by exact handle
  const admin = createAdminClient();
  const { data: addressee } = await admin
    .from("profiles")
    .select("id")
    .eq("handle", data.handle.toLowerCase())
    .maybeSingle();

  if (!addressee) return { error: "No user found with that handle" };
  if (addressee.id === user.id) return { error: "You cannot invite yourself" };

  // Check for existing partnership in either direction
  const { data: existing } = await supabase
    .from("workout_partners")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${addressee.id}),and(requester_id.eq.${addressee.id},addressee_id.eq.${user.id})`
    );

  if (existing && existing.length > 0) {
    const partnership = existing[0];
    if (partnership.status === "accepted") {
      return { error: "You are already partners" };
    }
    if (partnership.status === "pending") {
      return { error: "A partnership request already exists" };
    }
  }

  const { error } = await supabase.from("workout_partners").insert({
    requester_id: user.id,
    addressee_id: addressee.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/partners");
  return { data: true };
}

export async function respondToInvite(data: {
  partnership_id: string;
  action: "accepted" | "rejected";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("workout_partners")
    .update({ status: data.action })
    .eq("id", data.partnership_id)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  if (error) return { error: error.message };

  revalidatePath("/partners");
  return { data: true };
}

export async function removePartner(partnershipId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("workout_partners")
    .delete()
    .eq("id", partnershipId);

  if (error) return { error: error.message };

  revalidatePath("/partners");
  return { data: true };
}
