import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkoutCatalog } from "./_components/workout-catalog";
import type { WorkoutCardStats } from "./_components/workout-card";
import type { WorkoutCreator } from "./_components/workout-catalog";
import {
  parsePaginationParams,
  toRange,
  getTotalPages,
  clampPage,
} from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Workouts - GymTracker",
};

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  const userId = user!.id;
  const pagination = parsePaginationParams(params);
  const { from, to } = toRange(pagination);

  // Build paginated + searchable workouts query
  let workoutsQuery = supabase
    .from("workouts")
    .select("*, workout_tags(*, tags(*)), workout_images(*)", {
      count: "exact",
    })
    .order("name");

  if (params.q) {
    workoutsQuery = workoutsQuery.ilike("name", `%${params.q}%`);
  }

  workoutsQuery = workoutsQuery.range(from, to);

  const [workoutsRes, tagsRes, partnersRes] = await Promise.all([
    workoutsQuery,
    supabase.from("tags").select("*").order("name"),
    supabase
      .from("workout_partners")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
  ]);

  const partnerIds = (partnersRes.data ?? []).map((p) =>
    p.requester_id === userId ? p.addressee_id : p.requester_id
  );

  let partners: { id: string; full_name: string | null }[] = [];
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, partner_can_edit_logs")
      .in("id", partnerIds);
    partners = (profiles ?? [])
      .filter((p) => p.partner_can_edit_logs)
      .map(({ id, full_name }) => ({ id, full_name }));
  }

  // Per-exercise stats for the user, for the workouts visible on this page
  const workouts = workoutsRes.data ?? [];
  const visibleIds = workouts.map((w) => w.id);
  const statsByWorkout: Record<string, WorkoutCardStats> = {};

  if (visibleIds.length > 0) {
    const { data: logs } = await supabase
      .from("workout_logs")
      .select(
        "workout_id, performed_at, workout_sets(weight_kg, duration_seconds, distance_m)"
      )
      .eq("user_id", userId)
      .in("workout_id", visibleIds)
      .order("performed_at", { ascending: false });

    for (const log of logs ?? []) {
      const s = (statsByWorkout[log.workout_id] ??= {
        sessions: 0,
        lastPerformed: null,
        bestWeight: 0,
        bestDuration: 0,
        bestDistance: 0,
      });
      s.sessions += 1;
      // logs are newest-first, so the first one seen is the latest
      if (!s.lastPerformed) s.lastPerformed = log.performed_at;
      for (const set of log.workout_sets) {
        s.bestWeight = Math.max(s.bestWeight, Number(set.weight_kg) || 0);
        s.bestDuration = Math.max(s.bestDuration, set.duration_seconds ?? 0);
        s.bestDistance = Math.max(s.bestDistance, set.distance_m ?? 0);
      }
    }
  }

  // Creator names for user-added workouts (admin client — creators may be private)
  const creatorIds = [
    ...new Set(
      workouts.map((w) => w.created_by).filter((id): id is string => !!id)
    ),
  ];
  const creatorById: Record<string, WorkoutCreator> = {};
  if (creatorIds.length > 0) {
    const admin = createAdminClient();
    const { data: creators } = await admin
      .from("profiles")
      .select("id, full_name, handle")
      .in("id", creatorIds);
    for (const c of creators ?? []) {
      creatorById[c.id] = { full_name: c.full_name, handle: c.handle };
    }
  }

  const totalCount = workoutsRes.count ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);
  const currentPage = clampPage(pagination.page, totalPages);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Workouts</h1>
      <WorkoutCatalog
        workouts={workouts}
        tags={tagsRes.data ?? []}
        partners={partners}
        statsByWorkout={statsByWorkout}
        creatorById={creatorById}
        initialSearch={params.q ?? ""}
        currentPage={currentPage}
        pageSize={pagination.pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}
