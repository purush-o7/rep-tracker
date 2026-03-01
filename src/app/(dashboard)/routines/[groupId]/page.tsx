import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RoutineWorkoutList } from "./_components/routine-workout-list";

export const metadata: Metadata = {
  title: "Routine Detail - GymTracker",
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("workout_groups")
    .select("*, workout_group_items(*, workouts(*))")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/routines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground text-sm">
              {group.description}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/routines/${groupId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <RoutineWorkoutList items={group.workout_group_items} />
    </div>
  );
}
