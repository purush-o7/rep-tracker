import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RoutinesHub,
  type OwnRoutine,
  type DiscoverRoutine,
} from "./_components/routines-hub";

export const metadata: Metadata = {
  title: "My Routines - GymTracker",
};

type ItemRow = {
  sort_order: number;
  workouts: {
    name: string;
    workout_tags: { tags: { name: string } | null }[];
  } | null;
};

function shapeExercises(items: ItemRow[] | null) {
  return [...(items ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((it) => ({
      name: it.workouts?.name ?? "Unknown",
      tags: (it.workouts?.workout_tags ?? [])
        .map((t) => t.tags?.name)
        .filter((n): n is string => !!n),
    }));
}

const ITEM_SELECT =
  "id, name, description, is_public, user_id, workout_group_items(sort_order, workouts(name, workout_tags(tags(name))))";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const [ownRes, publicRes, scheduleRes] = await Promise.all([
    supabase
      .from("workout_groups")
      .select(ITEM_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("workout_groups").select(ITEM_SELECT).eq("is_public", true),
    supabase
      .from("weekly_schedule")
      .select("group_id, day_of_week")
      .eq("user_id", userId),
  ]);

  // group_id -> [day_of_week]
  const daysByGroup: Record<string, number[]> = {};
  for (const s of scheduleRes.data ?? []) {
    (daysByGroup[s.group_id] ??= []).push(s.day_of_week);
  }

  const own: OwnRoutine[] = (ownRes.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    isPublic: g.is_public,
    exercises: shapeExercises(g.workout_group_items as unknown as ItemRow[]),
    scheduledDays: daysByGroup[g.id] ?? [],
  }));

  const publicGroups = (publicRes.data ?? []).filter(
    (g) => g.user_id !== userId
  );

  const authorIds = [
    ...new Set(
      publicGroups.map((g) => g.user_id).filter((id): id is string => !!id)
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

  const discover: DiscoverRoutine[] = publicGroups
    .map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      isSystem: g.user_id === null,
      authorLabel: g.user_id ? authorById[g.user_id] ?? "a member" : null,
      exercises: shapeExercises(g.workout_group_items as unknown as ItemRow[]),
    }))
    // system programs first, then community
    .sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name));

  return <RoutinesHub own={own} discover={discover} />;
}
