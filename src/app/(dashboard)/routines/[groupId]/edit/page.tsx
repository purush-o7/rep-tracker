import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [groupRes, workoutsRes, scheduleRes] = await Promise.all([
    supabase
      .from("workout_groups")
      .select("*, workout_group_items(*, workouts(*))")
      .eq("id", groupId)
      .single(),
    supabase.from("workouts").select("*, workout_tags(tags(*))").order("name"),
    supabase.from("weekly_schedule").select("day_of_week").eq("group_id", groupId),
  ]);

  if (!groupRes.data) notFound();

  // Only the owner may edit — others get sent to the read-only detail view
  if (!user || groupRes.data.user_id !== user.id) {
    redirect(`/routines/${groupId}`);
  }

  const scheduledDays = (scheduleRes.data ?? []).map((s) => s.day_of_week);

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
        scheduledDays={scheduledDays}
      />
    </div>
  );
}
