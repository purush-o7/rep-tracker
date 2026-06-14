import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Sparkles, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RoutineWorkoutList } from "./_components/routine-workout-list";
import { CopyRoutineButton } from "../_components/copy-routine-button";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("workout_groups")
    .select("*, workout_group_items(*, workouts(*, workout_tags(tags(*))))")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const isOwner = !!user && group.user_id === user.id;
  const isSystem = group.user_id === null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/routines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <span className="truncate">{group.name}</span>
            {isSystem && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                System
              </span>
            )}
            {!isSystem && !isOwner && group.is_public && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Globe className="h-3 w-3" />
                Public
              </span>
            )}
          </h1>
          {group.description && (
            <p className="text-muted-foreground text-sm">{group.description}</p>
          )}
        </div>
        {isOwner ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/routines/${groupId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        ) : (
          <CopyRoutineButton groupId={groupId} />
        )}
      </div>

      {!isOwner && (
        <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
          This routine isn&apos;t yours to edit. Copy it to your routines to
          customise the exercises, targets and schedule.
        </p>
      )}

      <RoutineWorkoutList items={group.workout_group_items} />
    </div>
  );
}
