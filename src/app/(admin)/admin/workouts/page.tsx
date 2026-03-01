import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WorkoutTable } from "./_components/workout-table";
import { WorkoutFormWrapper } from "./_components/workout-form-wrapper";
import {
  parsePaginationParams,
  toRange,
  getTotalPages,
  clampPage,
} from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Manage Workouts - Admin - GymTracker",
};

export default async function AdminWorkoutsPage({
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
  const pagination = parsePaginationParams(params);
  const { from, to } = toRange(pagination);

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

  const [workoutsRes, tagsRes] = await Promise.all([
    workoutsQuery,
    supabase.from("tags").select("*").order("name"),
  ]);

  const workouts = workoutsRes.data ?? [];
  const workoutIds = workouts.map((w) => w.id);

  // Fetch usage stats for these workouts
  let workoutStats: Record<
    string,
    { logCount: number; uniqueUsers: number; lastLogged: string | null }
  > = {};

  if (workoutIds.length > 0) {
    const { data: logs } = await supabase
      .from("workout_logs")
      .select("workout_id, user_id, performed_at")
      .in("workout_id", workoutIds);

    const statsMap: Record<
      string,
      { users: Set<string>; count: number; lastLogged: string | null }
    > = {};

    (logs ?? []).forEach((log) => {
      if (!statsMap[log.workout_id]) {
        statsMap[log.workout_id] = {
          users: new Set(),
          count: 0,
          lastLogged: null,
        };
      }
      const stat = statsMap[log.workout_id];
      stat.count++;
      stat.users.add(log.user_id);
      if (!stat.lastLogged || log.performed_at > stat.lastLogged) {
        stat.lastLogged = log.performed_at;
      }
    });

    workoutStats = Object.fromEntries(
      Object.entries(statsMap).map(([id, stat]) => [
        id,
        {
          logCount: stat.count,
          uniqueUsers: stat.users.size,
          lastLogged: stat.lastLogged,
        },
      ])
    );
  }

  const totalCount = workoutsRes.count ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);
  const currentPage = clampPage(pagination.page, totalPages);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Catalog</h1>
        <WorkoutFormWrapper tags={tagsRes.data ?? []} />
      </div>
      <WorkoutTable
        workouts={workouts}
        tags={tagsRes.data ?? []}
        workoutStats={workoutStats}
        currentPage={currentPage}
        pageSize={pagination.pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}
