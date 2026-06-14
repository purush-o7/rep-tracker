import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve the signed-in user for server components without an Auth-server
 * round-trip. getClaims() verifies the JWT locally; the middleware already
 * validates & refreshes the session each request, so pages only need identity.
 * Falls back to getUser() if local verification is unavailable. Cached per request.
 */
export const getAuthUser = cache(
  async (
    supabase: SupabaseClient
  ): Promise<{ id: string; email: string | null } | null> => {
    try {
      const { data, error } = await supabase.auth.getClaims();
      const claims = data?.claims as { sub?: string; email?: string } | undefined;
      if (!error && claims?.sub) {
        return { id: claims.sub, email: claims.email ?? null };
      }
    } catch {
      // fall through to network validation
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email ?? null } : null;
  }
);

export async function requireAuth(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, user: null };
  return { error: null, user };
}

export async function requireAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin")
    return { error: "Not authorized" as const, user: null };

  return { error: null, user };
}
