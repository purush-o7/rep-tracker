import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WorkoutTable } from "./_components/workout-table";
import { WorkoutFormWrapper } from "./_components/workout-form-wrapper";

export const metadata: Metadata = {
  title: "Manage Workouts - Admin - GymTracker",
};

export default async function AdminWorkoutsPage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*, workout_tags(*, tags(*)), workout_images(*)")
    .order("name");

  const { data: tags } = await supabase.from("tags").select("*").order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Catalog</h1>
        <WorkoutFormWrapper tags={tags ?? []} />
      </div>
      <WorkoutTable workouts={workouts ?? []} tags={tags ?? []} />
    </div>
  );
}
