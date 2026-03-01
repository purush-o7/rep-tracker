"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, CalendarDays, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteWorkoutGroup } from "../actions";
import type { WorkoutGroupWithItems } from "@/lib/types";

interface RoutineListProps {
  groups: WorkoutGroupWithItems[];
}

export function RoutineList({ groups }: RoutineListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (groupId: string) => {
    setDeleting(groupId);
    const result = await deleteWorkoutGroup(groupId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Routine deleted");
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Routines</h1>
        {groups.length < 10 && (
          <Button asChild>
            <Link href="/routines/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Routine
            </Link>
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No routines yet. Create your first routine to organize your
              training.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/routines/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Routine
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {group.name}
                    </CardTitle>
                    {group.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {group.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <Link href={`/routines/${group.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(group.id)}
                      disabled={deleting === group.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                  <Dumbbell className="h-4 w-4" />
                  <span>
                    {group.workout_group_items.length}{" "}
                    {group.workout_group_items.length === 1
                      ? "exercise"
                      : "exercises"}
                  </span>
                </div>
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href={`/routines/${group.id}`}>View Routine</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
