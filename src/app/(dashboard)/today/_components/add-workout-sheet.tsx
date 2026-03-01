"use client";

import { useState } from "react";
import { ListPlus, Search, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addRoutineToPlan, addWorkoutToPlan } from "../actions";
import type { Workout, WorkoutGroup } from "@/lib/types";

interface AddWorkoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: (WorkoutGroup & { workout_group_items: { count: number }[] })[];
  workouts: Pick<Workout, "id" | "name">[];
}

export function AddWorkoutSheet({
  open,
  onOpenChange,
  routines,
  workouts,
}: AddWorkoutSheetProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredWorkouts = workouts.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddRoutine = async (groupId: string) => {
    setLoading(groupId);
    const result = await addRoutineToPlan(groupId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Routine workouts added to today's plan");
    }
    setLoading(null);
  };

  const handleAddWorkout = async (workoutId: string) => {
    setLoading(workoutId);
    const result = await addWorkoutToPlan(workoutId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Workout added to plan");
    }
    setLoading(null);
  };

  return (
    <ResponsiveSheetDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Add Workout"
      description="Add from a routine or pick individual workouts"
      icon={<ListPlus className="h-5 w-5 text-primary" />}
    >
      <Tabs defaultValue="routine" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="routine">From Routine</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="routine" className="mt-4 space-y-2">
          {routines.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <FolderOpen className="h-8 w-8" />
              <p className="text-sm">No routines yet</p>
              <p className="text-xs">
                Create routines in My Routines to quickly load workouts here
              </p>
            </div>
          ) : (
            routines.map((routine) => {
              const itemCount = routine.workout_group_items[0]?.count ?? 0;
              return (
                <button
                  key={routine.id}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  onClick={() => handleAddRoutine(routine.id)}
                  disabled={loading === routine.id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {routine.name}
                    </p>
                    {routine.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {routine.description}
                      </p>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "exercise" : "exercises"}
                  </span>
                </button>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="individual" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workouts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {filteredWorkouts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No workouts found
              </p>
            ) : (
              filteredWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
                >
                  <span className="text-sm truncate mr-2">{workout.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddWorkout(workout.id)}
                    disabled={loading === workout.id}
                    className="shrink-0"
                  >
                    {loading === workout.id ? "Adding..." : "Add"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveSheetDrawer>
  );
}
