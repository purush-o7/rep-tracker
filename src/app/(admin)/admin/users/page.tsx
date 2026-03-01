import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "./_components/users-table";
import {
  parsePaginationParams,
  toRange,
  getTotalPages,
  clampPage,
} from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Users - Admin - GymTracker",
};

export default async function AdminUsersPage({
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pagination = parsePaginationParams(params);
  const { from, to } = toRange(pagination);

  // 1. Paginated profiles with count + optional search
  let profileQuery = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.q) {
    profileQuery = profileQuery.or(
      `full_name.ilike.%${params.q}%,handle.ilike.%${params.q}%`
    );
  }

  profileQuery = profileQuery.range(from, to);

  const { data: profiles, count } = await profileQuery;

  // 2. Get auth users for email (using admin client)
  const admin = createAdminClient();
  const {
    data: { users: authUsers },
  } = await admin.auth.admin.listUsers();

  // 3. Fetch workout stats ONLY for this page's users
  const profileIds = (profiles ?? []).map((p) => p.id);
  let logCounts: { user_id: string; performed_at: string }[] = [];
  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("workout_logs")
      .select("user_id, performed_at")
      .in("user_id", profileIds);
    logCounts = data ?? [];
  }

  const userWorkoutMap: Record<
    string,
    { total: number; lastWorkout: string | null }
  > = {};
  logCounts.forEach((log) => {
    if (!userWorkoutMap[log.user_id]) {
      userWorkoutMap[log.user_id] = { total: 0, lastWorkout: null };
    }
    userWorkoutMap[log.user_id].total++;
    if (
      !userWorkoutMap[log.user_id].lastWorkout ||
      log.performed_at > userWorkoutMap[log.user_id].lastWorkout!
    ) {
      userWorkoutMap[log.user_id].lastWorkout = log.performed_at;
    }
  });

  const users = (profiles ?? []).map((profile) => {
    const authUser = authUsers?.find((u) => u.id === profile.id);
    const activity = userWorkoutMap[profile.id] ?? {
      total: 0,
      lastWorkout: null,
    };
    return {
      ...profile,
      email: authUser?.email ?? "unknown",
      total_workouts: activity.total,
      last_workout: activity.lastWorkout,
    };
  });

  const totalCount = count ?? 0;
  const totalPages = getTotalPages(totalCount, pagination.pageSize);
  const currentPage = clampPage(pagination.page, totalPages);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <UsersTable
        users={users}
        currentUserId={user!.id}
        currentPage={currentPage}
        pageSize={pagination.pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}
