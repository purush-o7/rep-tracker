import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RoutineList } from "./_components/routine-list";
import {
  DiscoverRoutines,
  type PublicRoutine,
} from "./_components/discover-routines";

export const metadata: Metadata = {
  title: "My Routines - GymTracker",
};

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const [ownRes, publicRes] = await Promise.all([
    supabase
      .from("workout_groups")
      .select("*, workout_group_items(*, workouts(*))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    // Public routines from others + system (user_id null); RLS allows reading public
    supabase
      .from("workout_groups")
      .select("id, name, description, user_id, workout_group_items(count)")
      .eq("is_public", true)
      .order("name"),
  ]);

  const own = ownRes.data ?? [];
  const publicGroups = (publicRes.data ?? []).filter(
    (g) => g.user_id !== userId
  );

  // Resolve author handles for community (non-system) public routines
  const authorIds = [
    ...new Set(
      publicGroups
        .map((g) => g.user_id)
        .filter((id): id is string => !!id)
    ),
  ];
  const authorById: Record<string, string> = {};
  if (authorIds.length > 0) {
    const admin = createAdminClient();
    const { data: authors } = await admin
      .from("profiles")
      .select("id, full_name, handle")
      .in("id", authorIds);
    for (const a of authors ?? []) {
      authorById[a.id] = a.handle ? `@${a.handle}` : a.full_name ?? "a member";
    }
  }

  const discover: PublicRoutine[] = publicGroups.map((g) => {
    const countRel = g.workout_group_items as unknown as { count: number }[];
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      itemCount: countRel?.[0]?.count ?? 0,
      isSystem: g.user_id === null,
      authorLabel: g.user_id ? authorById[g.user_id] ?? "a member" : null,
    };
  });

  return (
    <div className="space-y-8">
      <RoutineList groups={own} />
      <DiscoverRoutines routines={discover} />
    </div>
  );
}
