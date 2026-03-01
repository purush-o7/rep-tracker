import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RoutineList } from "./_components/routine-list";

export const metadata: Metadata = {
  title: "My Routines - GymTracker",
};

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const { data: groups } = await supabase
    .from("workout_groups")
    .select("*, workout_group_items(*, workouts(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return <RoutineList groups={groups ?? []} />;
}
