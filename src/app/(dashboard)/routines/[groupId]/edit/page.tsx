import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RoutineForm } from "../../_components/routine-form";

export const metadata: Metadata = {
  title: "Edit Routine - GymTracker",
};

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const [groupRes, workoutsRes] = await Promise.all([
    supabase
      .from("workout_groups")
      .select("*, workout_group_items(*, workouts(*))")
      .eq("id", groupId)
      .single(),
    supabase.from("workouts").select("*").order("name"),
  ]);

  if (!groupRes.data) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/routines/${groupId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Routine</h1>
      </div>
      <RoutineForm
        workouts={workoutsRes.data ?? []}
        editGroup={groupRes.data}
      />
    </div>
  );
}
