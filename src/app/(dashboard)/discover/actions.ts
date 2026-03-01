"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchPublicProfiles(query: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // RLS only returns public profiles with handles
  let profileQuery = supabase
    .from("profiles")
    .select("id, handle, full_name, avatar_url")
    .not("handle", "is", null)
    .neq("id", user.id)
    .order("handle")
    .limit(20);

  if (query.trim()) {
    const term = `%${query.trim().toLowerCase()}%`;
    profileQuery = profileQuery.or(`handle.ilike.${term},full_name.ilike.${term}`);
  }

  const { data: profiles, error } = await profileQuery;

  if (error) return { error: error.message };

  return { data: profiles ?? [] };
}
