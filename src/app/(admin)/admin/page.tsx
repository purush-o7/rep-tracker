import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "./_components/users-table";

export const metadata: Metadata = {
  title: "Users - Admin - GymTracker",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Get all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Get auth users for email (using admin client)
  const admin = createAdminClient();
  const {
    data: { users: authUsers },
  } = await admin.auth.admin.listUsers();

  // Get workout counts per user
  const { data: logCounts } = await supabase
    .from("workout_logs")
    .select("user_id, performed_at");

  const userWorkoutMap: Record<
    string,
    { total: number; lastWorkout: string | null }
  > = {};
  (logCounts ?? []).forEach((log) => {
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <UsersTable users={users} />
    </div>
  );
}
