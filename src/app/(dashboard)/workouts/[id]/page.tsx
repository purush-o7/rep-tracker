import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { WorkoutDetail } from "./_components/workout-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("name")
    .eq("id", id)
    .single();

  return { title: `${data?.name ?? "Workout"} - GymTracker` };
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("*, workout_tags(*, tags(*)), workout_images(*)")
    .eq("id", id)
    .single();

  if (!workout) notFound();

  return <WorkoutDetail workout={workout} />;
}
